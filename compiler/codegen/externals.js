const { libLLVM } = require('llvm-ffi');

function definePrintf (mod) {
  const params = [
    libLLVM.LLVMPointerType(libLLVM.LLVMInt8Type(), 0)
  ];

  const printfTypeRef = libLLVM.LLVMFunctionType(libLLVM.LLVMInt32Type(), params, 0, true);
  return libLLVM.LLVMAddFunction(mod, 'printf', printfTypeRef);
}

function createExternals (mod) {
  return {
    printf: definePrintf(mod)
  };
}

module.exports = createExternals;
