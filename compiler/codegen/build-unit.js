const { resolve } = require('path');

const ref = require('ref');
const { libLLVM, enums } = require('llvm-ffi');

class BuildUnit {
  constructor (buildDir, sourceName, llvmModule) {
    this.buildDir = buildDir;
    this.sourceName = sourceName;
    this.codeModule = llvmModule;

    this.objectFile = resolve(this.buildDir, `${this.sourceName}.o`);
    this.irFile = resolve(this.buildDir, `${this.sourceName}.ll`);
  }

  emitIRFile () {
    let error = ref.alloc(ref.refType(ref.types.char));
    libLLVM.LLVMPrintModuleToFile(this.codeModule, this.irFile, error.ref());
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
