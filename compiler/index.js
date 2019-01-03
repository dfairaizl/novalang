const { resolve } = require('path');
const { readFileSync } = require('fs');

const ref = require('ref');
const { libLLVM, enums } = require('llvm-ffi');

const Parser = require('./parser');
const CodeGenerator = require('./codegen');

class Compiler {
  constructor (entrySource, options) {
    this.baseDir = resolve(__dirname, '..', 'examples');
    this.buildDir = resolve(__dirname, '..', 'build');

    this.sources = [entrySource];
    this.options = {
      debugGraph: false,
      ...options
    };

    this.sourceModules = [];
  }

  compile () {
    // parse the entry souce code
    while (this.sources.length > 0) {
      const currentSource = this.sources.pop();
      const sourceGraph = this.parse(currentSource);

      this.sourceModules.push(sourceGraph);

      const dependantModules = sourceGraph.search('require_statement');
      dependantModules.forEach((m) => {
        const source = sourceGraph.relationFromNode(m, 'module');
        this.sources.push(`${source[0].attributes.value}.nv`);
      });
    }

    this.sourceModules.forEach((mod) => {
      if (this.options.debugGraph) {
        mod.debug();
      }

      const codeGenerator = new CodeGenerator(mod);
      codeGenerator.codegen();

      let error = ref.alloc(ref.refType(ref.types.char));

      // console.log('Emitting IR...');
      // const irFile = resolve(this.buildDir, 'simple.ll');
      // console.log(irFile);
      // libLLVM.LLVMPrintModuleToFile(codeGenerator.mod, irFile, error.ref());

      const objectFile = resolve(this.buildDir, 'simple.o');
      console.log('Compiled', objectFile);
      libLLVM.LLVMTargetMachineEmitToFile(
        codeGenerator.machine,
        codeGenerator.mod,
        objectFile,
        enums.LLVMCodeGenFileType.LLVMObjectFile,
        error.ref()
      );

      // codeGenerator.createMain();
    });
  }

  parse (sourceCode) {
    return this.parseModule(sourceCode);
  }

  parseModule (moduleSource) {
    const sourceFile = this.readSource(moduleSource);
    const parser = new Parser(sourceFile);

    return parser.parse();
  }

  readSource (sourceFile) {
    const path = resolve(this.baseDir, sourceFile);
    console.log('Compiling', path);
    return readFileSync(path);
  }
}

module.exports = Compiler;
