const { libLLVM, enums } = require('llvm-ffi');

class Value {
  constructor (allocStore) {
    this.ref = null;
    this.storage = allocStore;
  }
}

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
    this.namedValues[name] = new Value(ref);

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

    const ref = libLLVM.LLVMBuildLoad(this.builderRef, valueRef.storage, name);
    this.namedValues[name].ref = ref;

    return ref;
  }

  buildRet (returnType) {
    libLLVM.LLVMBuildRet(this.builderRef, returnType);
  }

  buildStore (name, varRef) {
    const namedValue = this.namedValues[name];
    namedValue.ref = null; // force the next reference to load the new value
    return libLLVM.LLVMBuildStore(this.builderRef, varRef, namedValue.storage);
  }

  buildAdd (lval, rval, placeholder) {
    return libLLVM.LLVMBuildAdd(this.builderRef, lval, rval, placeholder);
  }

  buildSub (lval, rval, placeholder) {
    return libLLVM.LLVMBuildSub(this.builderRef, lval, rval, placeholder);
  }

  buildMul (lval, rval, placeholder) {
    return libLLVM.LLVMBuildMul(this.builderRef, lval, rval, placeholder);
  }

  buildDiv (lval, rval, placeholder) {
    return libLLVM.LLVMBuildExactSDiv(this.builderRef, lval, rval, placeholder);
  }

  buildCompareGT (lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSGT.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareGTE (lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSGE.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareLT (lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSLT.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareLTE (lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSLE.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareEQ (lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntEQ.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareNEQ (lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntNE.value,
      lval,
      rval,
      placeholder
    );
  }

  buildVoidRet () {
    libLLVM.LLVMBuildRetVoid(this.builderRef);
  }
}

module.exports = LLVMBuilder;
