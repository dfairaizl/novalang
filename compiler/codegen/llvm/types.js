const { libLLVM } = require('llvm-ffi');

function Constant (ofType, value) {
  return libLLVM.LLVMConstInt(ofType, value);
}

function Pointer (ofType) {
  return libLLVM.LLVMPointerType(ofType, 0);
}

function Function (returnType, args, variadic = false) {

}

function Int1 () {
  return libLLVM.LLVMInt1Type();
}

function Int8 () {
  return libLLVM.LLVMInt8Type();
}

function Int32 () {
  return libLLVM.LLVMInt32Type();
}

function String (value) {
  return libLLVM.LLVMConstString(value, value.length, 1);
}

function Void () {
  return libLLVM.LLVMVoidType();
}

module.exports = {
  Constant,
  Int1,
  Int8,
  Int32,
  Function,
  Pointer,
  String,
  Void
};
