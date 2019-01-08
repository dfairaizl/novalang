const { libLLVM } = require('llvm-ffi');

class LLVMFunction {
  constructor (name, retType, params, variadic) {
    this.name = name;
    this.params = params;
    this.type = libLLVM.LLVMFunctionType(
      retType,
      params.map((p) => p.type),
      params.length,
      0
    );
  }
}

module.exports = LLVMFunction;
