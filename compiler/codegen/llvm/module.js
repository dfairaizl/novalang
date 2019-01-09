const { libLLVM } = require('llvm-ffi');

class LLVMModule {
  constructor (moduleName) {
    this.moduleRef = libLLVM.LLVMModuleCreateWithName(moduleName);
  }

  defineFunction (func) {
    const llvmFunc = libLLVM.LLVMAddFunction(this.moduleRef, func.name, func.type);

    func.createEntry(llvmFunc);

    func.params.forEach((p, index) => {
      const arg = libLLVM.LLVMGetParam(llvmFunc, index);
      libLLVM.LLVMSetValueName(arg, p.name);
    });
  }

  declareFunction (func) {
    const llvmFunc = libLLVM.LLVMAddFunction(this.moduleRef, func.name, func.type);

    func.params.forEach((p, index) => {
      const arg = libLLVM.LLVMGetParam(llvmFunc, index);
      libLLVM.LLVMSetValueName(arg, p.name);
    });
  }

  getNamedFunction (name) {
    return libLLVM.LLVMGetNamedFunction(this.moduleRef, name);
  }

  get ref () {
    return this.moduleRef;
  }
}

module.exports = LLVMModule;
