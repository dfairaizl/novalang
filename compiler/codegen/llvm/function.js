const { libLLVM } = require('llvm-ffi');

class LLVMFunction {
  constructor (module, name, retType, params, variadic, external) {
    this.name = name;
    this.params = params;
    this.type = libLLVM.LLVMFunctionType(
      retType,
      params.map((p) => p.type),
      params.length,
      variadic ? 1 : 0
    );

    this.ref = libLLVM.LLVMAddFunction(module.moduleRef, name, this.type);

    params.forEach((p, index) => {
      const param = libLLVM.LLVMGetParam(this.ref, index);
      libLLVM.LLVMSetValueName(param, p.name);
    });

    if (!external) {
      this.createEntry();
    }
  }

  createEntry (funcRef) {
    this.entryRef = libLLVM.LLVMAppendBasicBlock(this.ref, 'entry');
  }

  paramRefs () {
    return this.params.map((p, index) => {
      return {
        name: p.name,
        ref: libLLVM.LLVMGetParam(this.ref, index)
      };
    });
  }
}

module.exports = LLVMFunction;
