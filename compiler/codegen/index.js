const ref = require('ref');
const { libLLVM, types, enums } = require('llvm-ffi');

class CodeGenerator {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;

    this.initLLVM();
    this.createMain();
  }

  initLLVM () {
    libLLVM.LLVMInitializeX86Target();
    libLLVM.LLVMInitializeX86TargetInfo();
    libLLVM.LLVMInitializeX86AsmPrinter();
    libLLVM.LLVMInitializeX86AsmParser();
    libLLVM.LLVMInitializeX86TargetMC();

    const context = libLLVM.LLVMContextCreate();
    this.mod = libLLVM.LLVMModuleCreateWithName('test');
    this.builder = libLLVM.LLVMCreateBuilderInContext(context);

    let error = ref.alloc(ref.refType(ref.types.char));
    let target = ref.alloc(types.LLVMTargetRef);

    const triple = libLLVM.LLVMGetDefaultTargetTriple();

    if (libLLVM.LLVMGetTargetFromTriple(triple, target, error.ref()) > 0) {
      console.error('Unable to get target!');
      process.exit(1);
    }

    this.machine = libLLVM.LLVMCreateTargetMachine(
      target.deref(),
      triple,
      '', // CPU
      '', // Features
      enums.LLVMCodeGenOptLevel.LLVMCodeGenLevelDefault,
      enums.LLVMRelocMode.LLVMRelocDefault,
      enums.LLVMCodeModel.LLVMCodeModelDefault
    );

    if (this.machine.isNull()) {
      console.log('Could not create target machine');
    } else {
      console.log('LLVM ready');
    }
  }

  createMain () {
    const params = [
      libLLVM.LLVMInt32Type(), // argc
      libLLVM.LLVMPointerType(libLLVM.LLVMPointerType(libLLVM.LLVMInt8Type(), 0), 0)
    ];

    const mainFuncType = libLLVM.LLVMFunctionType(libLLVM.LLVMInt32Type(), params, 2, 0);
    const mainFunc = libLLVM.LLVMAddFunction(this.mod, 'main', mainFuncType);

    const argc = libLLVM.LLVMGetParam(mainFunc, 0);
    libLLVM.LLVMSetValueName(argc, 'argc');

    const argv = libLLVM.LLVMGetParam(mainFunc, 1);
    libLLVM.LLVMSetValueName(argv, 'argv');

    const entryBlock = libLLVM.LLVMAppendBasicBlock(mainFunc, 'entry');
    libLLVM.LLVMPositionBuilderAtEnd(this.builder, entryBlock);

    // const exitCode = libLLVM.LLVMConstInt(libLLVM.LLVMInt32Type(), 42);

    // libLLVM.LLVMBuildRet(this.builder, exitCode);

    this.mainFunc = mainFunc;
  }

  codegen () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');

    // iterate throught the modules adjacent nodes (direct children)
    const adj = this.sourceGraph.adjacencyList[codeModule.id];
    adj.edges.forEach((e) => {
      const node = e.target;
      if (node.attributes.type === 'immutable_declaration') {
        const varName = node.attributes.identifier;
        const expressionNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

        if (expressionNode.attributes.type === 'number_literal') {
          const numPtr = this.genNumberLiteral(expressionNode);
          const alloca = libLLVM.LLVMBuildAlloca(this.builder, libLLVM.LLVMInt32Type(), varName);
          libLLVM.LLVMBuildStore(this.builder, numPtr, alloca);
        }
      }
    });

    const ir = libLLVM.LLVMPrintModuleToString(this.mod);
    console.log('IR', ir);
  }

  genNumberLiteral (node) {
    return libLLVM.LLVMConstInt(libLLVM.LLVMInt32Type(), node.attributes.value);
  }
}

module.exports = CodeGenerator;
