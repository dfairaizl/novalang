const ref = require('ref');
const { libLLVM, types, enums } = require('llvm-ffi');

function buildTargetMachine () {
  let error = ref.alloc(ref.refType(ref.types.char));
  let target = ref.alloc(types.LLVMTargetRef);

  const triple = libLLVM.LLVMGetDefaultTargetTriple();

  if (libLLVM.LLVMGetTargetFromTriple(triple, target, error.ref()) > 0) {
    console.error('Unable to get target!');
    process.exit(1);
  }

  const machine = libLLVM.LLVMCreateTargetMachine(
    target.deref(),
    triple,
    '', // CPU
    '', // Features
    enums.LLVMCodeGenOptLevel.LLVMCodeGenLevelDefault,
    enums.LLVMRelocMode.LLVMRelocDefault,
    enums.LLVMCodeModel.LLVMCodeModelDefault
  );

  if (machine.isNull()) {
    console.log('Could not create target machine');
    return null;
  }

  return machine;
}

module.exports = buildTargetMachine;
