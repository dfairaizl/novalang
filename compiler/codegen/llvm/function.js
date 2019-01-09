const { libLLVM } = require('llvm-ffi');

class LLVMFunction {
  constructor (name, retType, params, variadic) {
    this.name = name;
    this.params = params;
    this.type = libLLVM.LLVMFunctionType(
      retType,
      params.map((p) => p.type),
      params.length,
      variadic ? 1 : 0
    );
  }

  createEntry (funcRef) {
    this.entryRef = libLLVM.LLVMAppendBasicBlock(funcRef, 'entry');
  }
}

module.exports = LLVMFunction;
