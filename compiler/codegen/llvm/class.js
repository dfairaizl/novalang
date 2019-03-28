const { libLLVM } = require('llvm-ffi');
const { Void } = require('./types');

class Class {
  constructor (module, name) {
    this.name = name;
    this.type = libLLVM.LLVMFunctionType(
      Void(),
      [],
      0,
      0
    );

    this.ref = libLLVM.LLVMAddFunction(module.moduleRef, name, this.type);

    this.createEntry();
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

module.exports = Class;
