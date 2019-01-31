const { libLLVM } = require('llvm-ffi');

class LLVMBuilder {
  constructor () {
    this.builderRef = libLLVM.LLVMCreateBuilder();

    this.functionStack = [];
  }

  enter (func) {
    this.functionStack.push(func);
    libLLVM.LLVMPositionBuilderAtEnd(this.builderRef, func.entryRef);
  }

  exit () {
    this.functionStack.pop();

    // reset the builder to the last known basic block
    const current = this.functionStack[this.functionStack.length - 1];
    libLLVM.LLVMPositionBuilderAtEnd(this.builderRef, current.entryRef);
  }

  buildCall (funcRef, args, identifier) {
    return libLLVM.LLVMBuildCall(this.builderRef, funcRef, args, args.length, identifier);
  }

  buildGlobalString (name, value) {
    return libLLVM.LLVMBuildGlobalStringPtr(this.builderRef, value, name);
  }

  buildRet (returnType) {
    libLLVM.LLVMBuildRet(this.builderRef, returnType);
  }

  buildVoidRet () {
    libLLVM.LLVMBuildRetVoid(this.builderRef);
  }
}

module.exports = LLVMBuilder;
