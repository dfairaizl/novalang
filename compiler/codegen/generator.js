const Builder = require('./llvm/builder');
const BuildUnit = require('./build-unit');
const Func = require('./llvm/function');
const Module = require('./llvm/module');
const Parameter = require('./llvm/parameter');

const {
  Constant,
  Int8,
  Int32,
  Pointer,
  Void
} = require('./llvm/types');

class Generator {
  constructor (buildDir, sourceGraph, codeModule) {
    this.buildDir = buildDir;
    this.sourceGraph = sourceGraph;
    this.codeModule = codeModule;

    this.builder = new Builder();
    this.module = this.codegenModule();

    this.namedVars = [];
  }

  generate () {
    this.builder.buildVoidRet();

    const sources = this.sourceGraph.outgoing(this.codeModule);
    sources.forEach((source) => {
      this.codegenNode(source);
    });

    if (this.codeModule.attributes.name === 'main_module') {
      this.createMain(this.codeModule.attributes.name);
    }

    return new BuildUnit(this.buildDir, this.codeModule.attributes.name, this.module);
  }

  // externals
  // const params = [
  //   new Parameter('format', Pointer(Int8()))
  // ];
  //
  // const printf = new Func('printf', Int32(), params, true);
  // this.module.declareFunction(printf);

  codegenModule () {
    const llvmMod = new Module(this.codeModule.attributes.name);

    const moduleFunc = new Func(this.codeModule.attributes.name, Void(), [], false);
    llvmMod.defineFunction(moduleFunc);
    this.builder.enter(moduleFunc);

    return llvmMod;
  }

  codegenNode (node) {
    switch (node.attributes.type) {
      case 'function':
        return this.codeGenFunction(node);
      // case 'return_statement':
      //   return this.codegenReturn(node);
      // case 'immutable_declaration':
      //   return this.codegenVar(node);
      // case 'invocation':
      //   return this.codegenInvocation(node);
      // case 'number_literal':
      //   return this.codegenNumberLiteral(node);
      default:
        console.log('Unknown expression', node.attributes.type);
    }
  }

  createMain (name) {
    const params = [
      new Parameter('argc', Int32()),
      new Parameter('argv', Pointer(Pointer(Int8())))
    ];

    const mainFunc = new Func('main', Int32(), params, false);
    this.module.defineFunction(mainFunc);

    this.builder.enter(mainFunc);

    const entryModuleRef = this.module.getNamedFunction(name);
    this.builder.buildCall(entryModuleRef, [], '');
    // libLLVM.LLVMBuildCall(this.builder, entryModuleRef, [], 0, ''); // last param is the variable to store call retval in

    const exitCode = Constant(Int32(), 0);

    this.builder.buildRet(exitCode);
  }

  codeGenFunction (funcNode) {
    const funcName = funcNode.attributes.name;
    const typeNode = this.sourceGraph.relationFromNode(funcNode, 'return_type')[0];
    const retType = this.getType(typeNode);

    // build argument type list
    const argTypes = this.sourceGraph.relationFromNode(funcNode, 'arguments').map((n) => {
      const typeNode = this.sourceGraph.relationFromNode(n, 'type')[0];
      return new Parameter(n.attributes.identifier, this.getType(typeNode));
    });

    const func = new Func(funcName, retType, argTypes, false);
    this.module.defineFunction(func);
    this.builder.enter(func);

    // build function body
    // const bodyNodes = this.sourceGraph.relationFromNode(funcNode, 'body');
    // bodyNodes.forEach((n) => this.codegenNode(n));

    const exitCode = Constant(Int32(), 0);

    this.builder.buildRet(exitCode);

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

  getType (typeNode) {
    switch (typeNode.attributes.kind) {
      case 'Int':
        return Int32();
      case 'String':
        return Pointer(Int8());
    }

    throw new Error('Unknown type', typeNode);
  }
}

module.exports = Generator;
