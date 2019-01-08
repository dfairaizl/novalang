const { libLLVM } = require('llvm-ffi');

function Pointer (ofType) {
  return libLLVM.LLVMPointerType(ofType, 0);
}

function Function (returnType, args, variadic = false) {

}

function Int8 () {
  return libLLVM.LLVMInt8Type();
}

function Int32 () {
  return libLLVM.LLVMInt32Type();
}

function Void () {
  return libLLVM.LLVMVoidType();
}

module.exports = {
  Int8,
  Int32,
  Function,
  Pointer,
  Void
};
