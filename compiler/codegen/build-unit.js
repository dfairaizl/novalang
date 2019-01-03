const { resolve } = require('path');

const ref = require('ref');
const { libLLVM, enums } = require('llvm-ffi');

class BuildUnit {
  constructor (buildDir, sourceFile, llvmModule) {
    this.buildDir = buildDir;
    this.sourceFile = sourceFile;
    this.codeModule = llvmModule;

    this.objectFile = resolve(this.buildDir, `${this.sourceName}.o`);
    this.irFile = resolve(this.buildDir, `${this.sourceName}.ll`);
  }

  emitIRFile () {
    let error = ref.alloc(ref.refType(ref.types.char));

    const irFile = resolve(this.buildDir, 'simple.ll');
    libLLVM.LLVMPrintModuleToFile(this.codeModule, irFile, error.ref());
  }

  emitObjectFile (machine) {
    let error = ref.alloc(ref.refType(ref.types.char));

    libLLVM.LLVMTargetMachineEmitToFile(
      machine,
      this.codeModule,
      this.objectFile,
      enums.LLVMCodeGenFileType.LLVMObjectFile,
      error.ref()
    );
  }
}

module.exports = BuildUnit;
