const { libLLVM } = require('llvm-ffi');

class LLVMBuilder {
  constructor () {
    this.builderRef = libLLVM.LLVMCreateBuilder();

    this.namedValues = {};
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

  buildAlloc (type, name) {
    const ref = libLLVM.LLVMBuildAlloca(this.builderRef, type, name);
    this.namedValues[name] = ref;

    return ref;
  }

  buildCall (funcRef, args, identifier) {
    return libLLVM.LLVMBuildCall(this.builderRef, funcRef, args, args.length, identifier);
  }

  buildGlobalString (name, value) {
    return libLLVM.LLVMBuildGlobalStringPtr(this.builderRef, value, name);
  }

  buildLoad (name) {
    const valueRef = this.namedValues[name];

    return libLLVM.LLVMBuildLoad(this.builderRef, valueRef, name);
  }

  buildRet (returnType) {
    libLLVM.LLVMBuildRet(this.builderRef, returnType);
  }

  buildStore (varRef, valueRef) {
    return libLLVM.LLVMBuildStore(this.builderRef, valueRef, varRef);
  }

  buildAdd (lval, rval, placeholder) {
    return libLLVM.LLVMBuildAdd(this.builderRef, lval, rval, placeholder);
  }

  buildVoidRet () {
    libLLVM.LLVMBuildRetVoid(this.builderRef);
  }
}

module.exports = LLVMBuilder;
