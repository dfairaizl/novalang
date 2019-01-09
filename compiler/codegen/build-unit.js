const { resolve } = require('path');

const ref = require('ref');
const { libLLVM, enums } = require('llvm-ffi');

class BuildUnit {
  constructor (buildDir, sourceName, module) {
    this.buildDir = buildDir;
    this.sourceName = sourceName;
    this.codeModule = module;

    this.objectFile = resolve(this.buildDir, `${this.sourceName}.o`);
    this.irFile = resolve(this.buildDir, `${this.sourceName}.ll`);
  }

  printIR () {
    console.log(libLLVM.LLVMPrintModuleToString(this.codeModule.ref));
  }

  emitIRFile () {
    let error = ref.alloc(ref.refType(ref.types.char));
    libLLVM.LLVMPrintModuleToFile(this.codeModule.ref, this.irFile, error.ref());
  }

  emitObjectFile (machine) {
    this.printIR();
    let error = ref.alloc(ref.refType(ref.types.char));

    libLLVM.LLVMTargetMachineEmitToFile(
      machine,
      this.codeModule.ref,
      this.objectFile,
      enums.LLVMCodeGenFileType.LLVMObjectFile,
      error.ref()
    );
  }
}

module.exports = BuildUnit;
