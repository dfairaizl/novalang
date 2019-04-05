const { libLLVM } = require('llvm-ffi');
const { Pointer, Void } = require('./types');

class Class {
  constructor (module, name, implicitRef) {
    this.name = name;
    this.type = libLLVM.LLVMFunctionType(
      Void(),
      [Pointer(implicitRef)],
      1,
      0
    );

    this.ref = libLLVM.LLVMAddFunction(module.moduleRef, name, this.type);

    // setup the implicit `this` reference
    const param = libLLVM.LLVMGetParam(this.ref, 0); // `this` is always first
    libLLVM.LLVMSetValueName(param, 'this');

    this.createEntry();
  }

  createEntry (funcRef) {
    this.entryRef = libLLVM.LLVMAppendBasicBlock(this.ref, 'entry');
  }

  instanceRef () {
    return libLLVM.LLVMGetParam(this.ref, 0);
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

module.exports = Class;
