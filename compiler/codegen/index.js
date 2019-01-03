const { basename } = require('path');

const { libLLVM } = require('llvm-ffi');

const createExternals = require('./externals');
const BuildUnit = require('./build-unit');

class CodeGenerator {
  constructor (buildDir, source, sourceGraph) {
    this.buildDir = buildDir;
    this.source = source;
    this.sourceGraph = sourceGraph;
    this.scope = {};

    this.sourceName = basename(this.source, '.nv');
    this.moduleName = `_${this.sourceName}_module`;
    this.mod = libLLVM.LLVMModuleCreateWithName(this.sourceName);
    this.builder = libLLVM.LLVMCreateBuilder();

    this.externals = createExternals(this.mod);
  }

  createMain (entryModuleRef) {
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

    if (entryModuleRef.isNull()) {
      console.error('Unknown function');
      return null;
    }

    libLLVM.LLVMBuildCall(this.builder, entryModuleRef, [], 0, ''); // last param is the variable to store call retval in

    const exitCode = libLLVM.LLVMConstInt(libLLVM.LLVMInt32Type(), 0);

    libLLVM.LLVMBuildRet(this.builder, exitCode);

    this.mainFunc = mainFunc;
  }

  codegen () {
    console.log('Compiling', `${this.sourceName}.nv`);

    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');

    let result;
    const modRef = this.genModule(codeModule);

    // iterate throught the modules adjacent nodes (direct children)
    const adj = this.sourceGraph.adjacencyList[codeModule.id];
    adj.edges.forEach((e) => {
      const node = e.target;
      if (node.attributes.type === 'immutable_declaration') {
        const varName = node.attributes.identifier;
        const expressionNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

        if (expressionNode.attributes.type === 'number_literal') {
          this.genNumberLiteral(varName, expressionNode);
        } else if (expressionNode.attributes.type === 'bin_op') {
          result = this.genBinOp(expressionNode);
        }
      }
    });

    const exitCode = libLLVM.LLVMConstInt(libLLVM.LLVMInt32Type(), 0);

    const format = libLLVM.LLVMBuildGlobalStringPtr(this.builder, 'Meaning of Life, %d!\n', 'format');
    const params = [format, result];

    libLLVM.LLVMBuildCall(this.builder, this.externals.printf, params, 2, 'printf');

    libLLVM.LLVMBuildRet(this.builder, exitCode);

    this.createMain(modRef);

    return new BuildUnit(this.buildDir, this.source, this.mod);
  }

  genModule (moduleNode) {
    const funcType = libLLVM.LLVMFunctionType(libLLVM.LLVMVoidType(), [], 0, 0);
    const moduleFunc = libLLVM.LLVMAddFunction(this.mod, this.moduleName, funcType);

    const entryBlock = libLLVM.LLVMAppendBasicBlock(moduleFunc, 'entry');
    libLLVM.LLVMPositionBuilderAtEnd(this.builder, entryBlock);

    return moduleFunc;
  }

  genNumberLiteral (varName, node) {
    const type = libLLVM.LLVMInt32Type();
    const val = libLLVM.LLVMConstInt(type, node.attributes.value);

    const alloca = libLLVM.LLVMBuildAlloca(this.builder, type, varName);
    libLLVM.LLVMBuildStore(this.builder, val, alloca);

    this.scope[varName] = alloca;
  }

  genBinOp (opNode) {
    const left = this.sourceGraph.relationFromNode(opNode, 'left')[0];
    const right = this.sourceGraph.relationFromNode(opNode, 'right')[0];

    const lhs = this.genExpression(left);
    const rhs = this.genExpression(right);

    switch (opNode.attributes.operator) {
      case '+':
        return libLLVM.LLVMBuildAdd(this.builder, lhs, rhs, 'addt');
    }
  }

  genExpression (node) {
    switch (node.attributes.type) {
      case 'identifier':
        return this.genIdentifier(node);
    }
  }

  genIdentifier (node) {
    const id = this.scope[node.attributes.identifier];
    return libLLVM.LLVMBuildLoad(this.builder, id, node.attributes.identifier);
  }
}

module.exports = CodeGenerator;
