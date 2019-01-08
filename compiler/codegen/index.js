const { basename } = require('path');

const { libLLVM } = require('llvm-ffi');

const Module = require('./llvm/module');
const Func = require('./llvm/function');
const Parameter = require('./llvm/parameter');
const {
  Int8,
  Int32,
  Pointer,
  Void
} = require('./llvm/types');

// const createExternals = require('./externals');
const BuildUnit = require('./build-unit');

class CodeGenerator {
  constructor (buildDir, source, sourceGraph) {
    this.buildDir = buildDir;
    this.source = source;
    this.sourceGraph = sourceGraph;
    this.scope = {};

    this.sourceName = basename(this.source, '.nv');
    this.moduleName = `_${this.sourceName}_module`;
    this.mod = new Module(this.sourceName);
    this.builder = libLLVM.LLVMCreateBuilder();

    this.builderPos = [];
  }

  createMain (entryModuleRef) {
    const params = [
      new Parameter('argc', Int32()),
      new Parameter('argv', Pointer(Pointer(Int8())))
    ];

    const mainFunc = new Func('main', Int32(), params, false);
    const main = this.mod.addFunction(mainFunc);

    const entryBlock = libLLVM.LLVMAppendBasicBlock(main, 'entry');
    libLLVM.LLVMPositionBuilderAtEnd(this.builder, entryBlock);

    libLLVM.LLVMBuildCall(this.builder, entryModuleRef, [], 0, ''); // last param is the variable to store call retval in

    const exitCode = libLLVM.LLVMConstInt(libLLVM.LLVMInt32Type(), 0);
    //
    libLLVM.LLVMBuildRet(this.builder, exitCode);

    this.mainFunc = mainFunc;
  }

  codegen () {
    console.log('Compiling', `${this.sourceName}.nv`);

    const params = [
      libLLVM.LLVMPointerType(libLLVM.LLVMInt8Type(), 0)
    ];

    const printfTypeRef = libLLVM.LLVMFunctionType(libLLVM.LLVMInt32Type(), params, 0, true);
    libLLVM.LLVMAddFunction(this.mod.module, 'printf', printfTypeRef);

    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const modRef = this.genModule(codeModule);

    // // iterate throught the modules adjacent nodes (direct children)
    const adj = this.sourceGraph.adjacencyList[codeModule.id];
    adj.edges.forEach((e) => {
      const node = e.target;
      this.generate(node);
    });

    libLLVM.LLVMBuildRetVoid(this.builder);

    this.createMain(modRef);

    return new BuildUnit(this.buildDir, this.sourceName, this.mod);
  }

  generate (node) {
    console.log(node.attributes);
    if (node.attributes.type === 'function') {
      const args = this.sourceGraph.relationFromNode(node, 'arguments');
      const funcName = `${this.moduleName}_${node.attributes.name}`;
      this.genFunction(funcName, Int32(), args, false);

      const body = this.sourceGraph.relationFromNode(node, 'body')[0];
      this.generate(body);
      this.builderPos.pop();
      const bb = this.builderPos[this.builderPos.length - 1];
      libLLVM.LLVMPositionBuilderAtEnd(this.builder, bb);
    } else if (node.attributes.type === 'return_statement') {
      const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];
      const ref = this.generate(expr);
      libLLVM.LLVMBuildRet(this.builder, ref);
    } else if (node.attributes.type === 'number_literal') {
      const type = libLLVM.LLVMInt32Type();
      return libLLVM.LLVMConstInt(type, node.attributes.value);
    } else if (node.attributes.type === 'string_literal') {
      return libLLVM.LLVMBuildGlobalStringPtr(this.builder, node.attributes.value, 'format');
    } else if (node.attributes.type === 'immutable_declaration') {
      const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];
      if (expr.attributes.type === 'invocation') {
        this.genInvocation(expr, node.attributes.identifier);
      }
    } else if (node.attributes.type === 'invocation') {
      this.genExternalInvocation(node);
    } else if (node.attributes.type === 'identifier') {
      return this.scope[node.attributes.identifier];
    }
  }

  genInvocation (node, identName = '') {
    const name = `${this.moduleName}_${node.attributes.name}`;
    const func = libLLVM.LLVMGetNamedFunction(this.mod.module, name);
    const call = libLLVM.LLVMBuildCall(this.builder, func, [], 0, identName);
    this.scope[identName] = call;
    return call;
  }

  genExternalInvocation (node, identName = '') {
    console.log(this.scope);
    const name = `${node.attributes.name}`;
    const args = this.sourceGraph.relationFromNode(node, 'arguments');

    const argVals = args.map((a) => this.generate(a));
    console.log(argVals);

    const func = libLLVM.LLVMGetNamedFunction(this.mod.module, name);
    const call = libLLVM.LLVMBuildCall(this.builder, func, argVals, argVals.length, identName);
    return call;
  }

  genFunction (name, retType, params, variadic) {
    const ref = new Func(name, retType, params, variadic);
    const func = this.mod.addFunction(ref);

    const entryBlock = libLLVM.LLVMAppendBasicBlock(func, 'entry');
    libLLVM.LLVMPositionBuilderAtEnd(this.builder, entryBlock);

    this.builderPos.push(entryBlock);

    return func;
  }

  genModule (moduleNode) {
    const moduleFunc = this.genFunction(this.moduleName, Void(), [], false);
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
    const name = node.attributes.identifier;
    const ref = libLLVM.LLVMBuildAlloca(this.builder, Int32(), name);

    this.scope[name] = ref;
    return libLLVM.LLVMBuildLoad(this.builder, ref, name);
  }
}

module.exports = CodeGenerator;
