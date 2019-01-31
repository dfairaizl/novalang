const { basename } = require('path');

const Builder = require('./llvm/builder');
const Module = require('./llvm/module');
const Func = require('./llvm/function');
const Parameter = require('./llvm/parameter');
const {
  Constant,
  Int8,
  Int32,
  Pointer,
  Void
} = require('./llvm/types');

const BuildUnit = require('./build-unit');

class CodeGenerator {
  constructor (buildDir, source, sourceGraph) {
    this.buildDir = buildDir;
    this.source = source;
    this.sourceGraph = sourceGraph;
    this.scope = {};

    this.sourceName = basename(this.source, '.nv');
    this.moduleuleName = `${this.sourceName}_module`;
    this.module = new Module(this.sourceName);
    this.builder = new Builder();
    this.namedVars = [];

    this.builderPos = [];
  }

  createMain () {
    const params = [
      new Parameter('argc', Int32()),
      new Parameter('argv', Pointer(Pointer(Int8())))
    ];

    const mainFunc = new Func('main', Int32(), params, false);
    this.module.defineFunction(mainFunc);

    this.builder.enter(mainFunc);

    const entryModuleRef = this.module.getNamedFunction(this.moduleuleName);
    this.builder.buildCall(entryModuleRef, [], '');
    // libLLVM.LLVMBuildCall(this.builder, entryModuleRef, [], 0, ''); // last param is the variable to store call retval in

    const exitCode = Constant(Int32(), 0);

    this.builder.buildRet(exitCode);
  }

  codegen () {
    console.log('Compiling', `${this.sourceName}.nv`);

    // externals
    const params = [
      new Parameter('format', Pointer(Int8()))
    ];

    const printf = new Func('printf', Int32(), params, true);
    this.module.declareFunction(printf);

    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    this.codegenModule(codeModule);

    // iterate throught the modules adjacent nodes (direct children)
    const adj = this.sourceGraph.adjacencyList[codeModule.id];
    adj.edges.forEach((e) => {
      const node = e.target;
      this.codegenNode(node);
    });

    this.builder.buildVoidRet();

    this.createMain();

    return new BuildUnit(this.buildDir, this.sourceName, this.module);
  }

  codegenNode (node) {
    switch (node.attributes.type) {
      case 'function':
        return this.codeGenFunction(node);
      case 'return_statement':
        return this.codegenReturn(node);
      case 'immutable_declaration':
        return this.codegenVar(node);
      case 'invocation':
        return this.codegenInvocation(node);
      case 'number_literal':
        return this.codegenNumberLiteral(node);
      default:
        console.log('Unknown expression', node.attributes.type);
    }
  }

  // Code Generation

  codegenModule (moduleNode) {
    const moduleFunc = new Func(this.moduleuleName, Void(), [], false);
    this.module.defineFunction(moduleFunc);
    this.builder.enter(moduleFunc);

    return moduleFunc;
  }

  codeGenFunction (funcNode) {
    const funcName = funcNode.attributes.name;
    const retType = Int32(); // this should be added by the parser via a grpah query in the type system

    // build argument type list
    const argTypes = this.sourceGraph.relationFromNode(funcNode, 'arguments').map((n) => {
      return this.buildType(n.attributes.type);
    });

    const func = new Func(funcName, retType, argTypes, false);
    this.module.defineFunction(func);
    this.builder.enter(func);

    // build function body
    const bodyNodes = this.sourceGraph.relationFromNode(funcNode, 'body');
    bodyNodes.forEach((n) => this.codegenNode(n));

    this.builder.exit();
  }

  codegenReturn (node) {
    // get the return expression
    const retNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    // code gen expression
    const expr = this.codegenNode(retNode);

    this.builder.buildRet(expr);
  }

  codegenVar (node) {
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    if (exprNode.attributes.type === 'invocation') {
      this.codegenInvocation(exprNode, node.attributes.identifier);
    }
  }

  codegenInvocation (node, identifier = '') {
    // look up function in module
    const funcRef = this.module.getNamedFunction(node.attributes.name);

    // build argument type list
    const argTypes = this.sourceGraph.relationFromNode(node, 'arguments').map((n) => {
      return this.buildType(n);
    });

    const ref = this.builder.buildCall(funcRef, argTypes, identifier);
    if (identifier.length > 0) {
      this.namedVars[identifier] = ref;
    }
  }

  codegenNumberLiteral (node) {
    const val = node.attributes.value;
    return Constant(Int32(), val);
  }

  // Helpers

  buildType (node) {
    switch (node.attributes.type) {
      case 'string_literal':
        return this.builder.buildGlobalString('format', node.attributes.value);
      default:
        return this.namedVars[node.attributes.identifier];
    }
  }

  // genBinOp (opNode) {
  //   const left = this.sourceGraph.relationFromNode(opNode, 'left')[0];
  //   const right = this.sourceGraph.relationFromNode(opNode, 'right')[0];
  //
  //   const lhs = this.genExpression(left);
  //   const rhs = this.genExpression(right);
  //
  //   switch (opNode.attributes.operator) {
  //     case '+':
  //       return libLLVM.LLVMBuildAdd(this.builder, lhs, rhs, 'addt');
  //   }
  // }
}

module.exports = CodeGenerator;
