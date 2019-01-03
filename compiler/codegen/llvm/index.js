const { libLLVM } = require('llvm-ffi');

function initTarget () {
  libLLVM.LLVMInitializeX86Target();
  libLLVM.LLVMInitializeX86TargetInfo();
  libLLVM.LLVMInitializeX86AsmPrinter();
  libLLVM.LLVMInitializeX86AsmParser();
  libLLVM.LLVMInitializeX86TargetMC();
}

function init () {
  initTarget();
}

module.exports = init;
