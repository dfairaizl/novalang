const { resolve } = require('path');
const { readFileSync } = require('fs');
const { spawn } = require('child_process');

const Parser = require('./parser');
const CodeGenerator = require('./codegen');
const LLVMInit = require('./codegen/llvm');
const buildTargetMachine = require('./codegen/llvm/machine');

class Compiler {
  constructor (entrySource, programName, options) {
    this.baseDir = resolve(__dirname, '..', 'examples');
    this.buildDir = resolve(__dirname, '..', 'build');

    this.outputProgramName = resolve(__dirname, this.buildDir, programName);
    this.sources = [entrySource];
    this.options = {
      debugGraph: false,
      ...options
    };

    LLVMInit();
    this.machine = buildTargetMachine();

    this.sourceModules = [];
    this.compiledModules = [];
  }

  compile () {
    // parse the entry souce code
    console.log('Compiling source files');

    while (this.sources.length > 0) {
      const currentSource = this.sources.pop();

      const sourceFile = resolve(this.baseDir, currentSource);
      const sourceCode = this.readSource(currentSource);
      const sourceGraph = this.parse(sourceCode);

      this.sourceModules.push(sourceGraph);

      const dependantModules = sourceGraph.search('require_statement');
      dependantModules.forEach((m) => {
        const source = sourceGraph.relationFromNode(m, 'module');
        this.sources.push(`${source[0].attributes.value}.nv`);
      });

      const codeGenerator = new CodeGenerator(this.buildDir, sourceFile, sourceGraph);

      const buildUnit = codeGenerator.codegen();

      this.compiledModules.push(buildUnit);
    }

    console.log('Generating object files');
    this.compiledModules.forEach((unit) => {
      unit.emitObjectFile(this.machine);
    });

    // Link the object files into a binary
    console.log('Creating binary');

    const linkerParams = ['-o', this.outputProgramName];
    this.compiledModules.forEach((unit) => {
      linkerParams.push(unit.objectFile);
    });

    // build resulting binary
    spawn('clang', linkerParams);

    console.log('Done - ', this.outputProgramName);
  }

  parse (sourceCode) {
    return this.parseModule(sourceCode);
  }

  parseModule (moduleSource) {
    const parser = new Parser(moduleSource);

    return parser.parse();
  }

  readSource (sourceFile) {
    return readFileSync(sourceFile);
  }
}

module.exports = Compiler;
