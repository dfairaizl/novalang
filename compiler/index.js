const { basename, resolve } = require('path');
const { readFileSync } = require('fs');
const { spawn } = require('child_process');

const { Query } = require('@novalang/graph');

const Parser = require('./parser');
const SemanticAnalyzer = require('./semantic');
const CodeGenerator = require('./codegen');
const LLVMInit = require('./codegen/llvm');
const buildTargetMachine = require('./codegen/llvm/machine');

const STANDARD_LIBRARY = ['io'];

class Source {
  constructor (name, path) {
    this.name = name;
    this.path = path;
  }

  readSource () {
    return readFileSync(this.path);
  }

  fileName () {
    return basename(this.path, '.nv');
  }
}

class Compiler {
  constructor (entrySource, programName, options) {
    this.libraryDir = resolve(__dirname, '..', 'compiler', 'library');
    this.baseDir = resolve(__dirname, '..', 'examples');
    this.buildDir = resolve(__dirname, '..', 'build');
    this.outputProgramName = resolve(__dirname, this.buildDir, programName);

    this.sources = [
      new Source('main_module', entrySource)
    ];

    this.options = {
      debugGraph: false,
      ...options
    };

    LLVMInit();
    this.machine = buildTargetMachine();

    this.sourceGraph = null;
    this.compiledModules = [];
  }

  compile () {
    // parse the entry souce code
    console.log('Compiling source files');

    while (this.sources.length > 0) {
      const currentSource = this.sources.pop();

      console.log(' - ', currentSource.fileName());

      debugger;
      const sourceGraph = this.parse(currentSource);

      if (!this.sourceGraph) {
        this.sourceGraph = sourceGraph;
      } else {
        this.sourceGraph.merge(sourceGraph);
      }

      const q = new Query(sourceGraph);
      const results = q.match({ type: 'import_statement' }, { name: 'deps' }).returns('deps');

      results.deps.forEach((m) => {
        const importSource = this.createSource(m);
        this.sources.push(importSource);
      });
    }


    const analyzer = new SemanticAnalyzer(this.sourceGraph);
    analyzer.analyze();

    if (this.options.debugGraph) {
      this.sourceGraph.debug();
    }

    // generate LLVM IR and comile it for the target machine
    const codeGenerator = new CodeGenerator(this.buildDir, this.sourceGraph);
    const buildUnits = codeGenerator.codegen();

    // emit binary object files for the program before linking
    console.log('Generating object files');
    buildUnits.forEach((unit) => {
      unit.emitObjectFile(this.machine);
    });

    // link the object files into a binary
    console.log('Creating binary');

    const linkerParams = ['-o', this.outputProgramName];
    buildUnits.forEach((unit) => {
      linkerParams.push(unit.objectFile);
    });

    // build resulting binary
    spawn('clang', linkerParams);

    console.log('Done - ', this.outputProgramName);
  }

  parse (source) {
    return this.parseModule(source);
  }

  parseModule (moduleSource) {
    const parser = new Parser(moduleSource.readSource(), moduleSource.name);

    return parser.parse();
  }

  createSource (node) {
    const importName = node.attributes.identifier;

    if (STANDARD_LIBRARY.includes(importName)) {
      return new Source(importName, resolve(this.libraryDir, `${importName}.nv`));
    }

    return new Source(importName, resolve(this.baseDir, `${node.attributes.name}.nv`));
  }
}

module.exports = Compiler;
