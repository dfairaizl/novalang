const { libLLVM } = require('llvm-ffi');

class LLVMModule {
  constructor (moduleName) {
    this.module = libLLVM.LLVMModuleCreateWithName(moduleName);
  }

  addFunction (func) {
    const llvmFunc = libLLVM.LLVMAddFunction(this.module, func.name, func.type);

    func.params.forEach((p, index) => {
      const arg = libLLVM.LLVMGetParam(llvmFunc, index);
      libLLVM.LLVMSetValueName(arg, p.name);
    });

    return llvmFunc;
  }
}

module.exports = LLVMModule;
