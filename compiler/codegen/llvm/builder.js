const { libLLVM, enums } = require("llvm-ffi");

class Value {
  constructor(allocStore) {
    this.ref = null;
    this.storage = allocStore;
  }
}

class LLVMBuilder {
  constructor() {
    this.builderRef = libLLVM.LLVMCreateBuilder();

    this.namedValues = {};
    this.functionStack = [];
  }

  enter(func) {
    this.functionStack.push(func);
    libLLVM.LLVMPositionBuilderAtEnd(this.builderRef, func.entryRef);
  }

  exit() {
    this.functionStack.pop();

    // reset the builder to the last known basic block
    const current = this.functionStack[this.functionStack.length - 1];
    libLLVM.LLVMPositionBuilderAtEnd(this.builderRef, current.entryRef);
  }

  setClass(aClass) {
    this.currentClass = aClass;
  }

  positionAt(basicBlock) {
    libLLVM.LLVMPositionBuilderAtEnd(this.builderRef, basicBlock);
  }

  buildAlloc(type, name) {
    const ref = libLLVM.LLVMBuildAlloca(this.builderRef, type, name);
    this.namedValues[name] = new Value(ref);

    return ref;
  }

  buildCall(funcRef, args, identifier) {
    return libLLVM.LLVMBuildCall(
      this.builderRef,
      funcRef,
      args,
      args.length,
      identifier
    );
  }

  buildGlobalString(name, value) {
    return libLLVM.LLVMBuildGlobalStringPtr(this.builderRef, value, name);
  }

  buildLoad(name) {
    const valueRef = this.namedValues[name];

    const ref = libLLVM.LLVMBuildLoad(this.builderRef, valueRef.storage, name);
    this.namedValues[name].ref = ref;

    return ref;
  }

  buildRet(returnType) {
    libLLVM.LLVMBuildRet(this.builderRef, returnType);
  }

  buildStore(name, varRef) {
    const namedValue = this.namedValues[name];
    namedValue.ref = null; // force the next reference to load the new value
    return libLLVM.LLVMBuildStore(this.builderRef, varRef, namedValue.storage);
  }

  buildArray(arrayType, placeholder) {
    const arrayRef = libLLVM.LLVMBuildArrayAlloca(
      this.builderRef,
      arrayType,
      null,
      placeholder
    );

    this.namedValues[placeholder] = new Value(arrayRef);

    return arrayRef;
  }

  buildAdd(lval, rval, placeholder) {
    return libLLVM.LLVMBuildAdd(this.builderRef, lval, rval, placeholder);
  }

  buildSub(lval, rval, placeholder) {
    return libLLVM.LLVMBuildSub(this.builderRef, lval, rval, placeholder);
  }

  buildMul(lval, rval, placeholder) {
    return libLLVM.LLVMBuildMul(this.builderRef, lval, rval, placeholder);
  }

  buildDiv(lval, rval, placeholder) {
    return libLLVM.LLVMBuildExactSDiv(this.builderRef, lval, rval, placeholder);
  }

  buildRem(lval, rval, placeholder) {
    return libLLVM.LLVMBuildSRem(this.builderRef, lval, rval, placeholder);
  }

  buildCompareGT(lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSGT.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareGTE(lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSGE.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareLT(lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSLT.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareLTE(lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntSLE.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareEQ(lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntEQ.value,
      lval,
      rval,
      placeholder
    );
  }

  buildCompareNEQ(lval, rval, placeholder) {
    return libLLVM.LLVMBuildICmp(
      this.builderRef,
      enums.LLVMIntPredicate.LLVMIntNE.value,
      lval,
      rval,
      placeholder
    );
  }

  buildVoidRet() {
    libLLVM.LLVMBuildRetVoid(this.builderRef);
  }

  buildConditionalBranch(condition, posBranch, negBranch) {
    libLLVM.LLVMBuildCondBr(this.builderRef, condition, posBranch, negBranch);
  }

  buildBranch(branchBlock) {
    libLLVM.LLVMBuildBr(this.builderRef, branchBlock);
  }

  insertBlock(blockName) {
    const func = libLLVM.LLVMGetBasicBlockParent(
      libLLVM.LLVMGetInsertBlock(this.builderRef)
    );
    return libLLVM.LLVMAppendBasicBlock(func, blockName);
  }

  insertBlockBeforeBlock(prevBlock, blockName) {
    const func = libLLVM.LLVMGetBasicBlockParent(
      libLLVM.LLVMGetInsertBlock(this.builderRef)
    );
    const block = libLLVM.LLVMAppendBasicBlock(func, blockName);

    libLLVM.LLVMMoveBasicBlockBefore(block, prevBlock);

    return block;
  }
}

module.exports = LLVMBuilder;
