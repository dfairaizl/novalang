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
  }

  generate () {
    const sources = this.sourceGraph.outgoing(this.codeModule);
    sources.forEach((source) => {
      this.codegenNode(source);
    });

    this.builder.buildVoidRet();

    if (this.codeModule.attributes.name === 'main_module') {
      this.createMain(this.codeModule.attributes.name);
    }

    return new BuildUnit(this.buildDir, this.codeModule.attributes.name, this.module);
  }

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
      case 'external_function':
        return this.codeGenExternalFunction(node);
      case 'import_statement':
        return this.codeGenImports(node);
      case 'variable_reference':
        return this.codegenReference(node);
      case 'return_statement':
        return this.codegenReturn(node);
      case 'immutable_declaration':
        return this.codegenVar(node);
      case 'invocation':
        return this.codegenInvocation(node);
      case 'number_literal':
      case 'string_literal':
        return this.buildValue(node);
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
    const bodyNodes = this.sourceGraph.relationFromNode(funcNode, 'body');
    bodyNodes.forEach((n) => this.codegenNode(n));

    const exitCode = Constant(Int32(), 0);

    // this.builder.buildRet(exitCode);

    this.builder.exit();
  }

  codeGenExternalFunction (node) {
    const funcName = node.attributes.name;
    const retType = this.getType(node);

    // build argument type list
    const args = this.sourceGraph.relationFromNode(node, 'arguments');
    const variadic = args.find((a) => a.attributes.kind === 'variadic');
    const argTypes = args
      .filter((a) => a.attributes.kind !== 'variadic')
      .map((n) => {
        return new Parameter(n.attributes.identifier, this.getExternalType(n.attributes.kind));
      });

    const func = new Func(funcName, retType, argTypes, variadic !== undefined);
    this.module.declareFunction(func);
  }

  codeGenImports (node) {
    const imports = this.sourceGraph.relationFromNode(node, 'import');
    imports.forEach((i) => {
      const importFunc = this.sourceGraph.relationFromNode(i, 'binding')[0];
      this.codegenNode(importFunc);
    });
  }

  codegenReturn (node) {
    // get the return expression
    const retNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    // code gen expression
    const expr = this.codegenNode(retNode);

    this.builder.buildRet(expr);
  }

  codegenVar (node) {
    const typeNode = this.sourceGraph.relationFromNode(node, 'type')[0];
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    const varRef = this.builder.buildAlloc(this.getType(typeNode), node.attributes.identifier);
    const expr = this.codegenNode(exprNode);

    this.builder.buildStore(varRef, expr);
  }

  codegenReference (node) {
    return this.builder.buildLoad(node.attributes.identifier);
  }

  codegenInvocation (node, identifier = '') {
    // look up function in module
    const funcRef = this.module.getNamedFunction(node.attributes.name);

    // build argument type list
    const argTypes = this.sourceGraph.relationFromNode(node, 'arguments').map((n) => {
      return this.codegenNode(n);
    });

    return this.builder.buildCall(funcRef, argTypes, identifier);
  }

  codegenNumberLiteral (node) {
    const val = node.attributes.value;
    return Constant(Int32(), val);
  }

  // Helpers

  buildValue (node) {
    switch (node.attributes.kind) {
      case 'Int':
        return Constant(this.getType(node), node.attributes.value);
      case 'String':
        return this.builder.buildGlobalString('format', node.attributes.value);
    }
  }

  getType (typeNode) {
    switch (typeNode.attributes.kind) {
      case 'Int':
        return Int32();
    }

    throw new Error(`Unknown type ${typeNode.attributes.kind}`);
  }

  getExternalType (type) {
    let externalType = null;

    if (type.kind) {
      switch (type.kind) {
        case 'Int':
          externalType = Int32();
          break;
        case 'char':
          externalType = Int8();
          break;
      }

      if (type.indirection > 0) {
        return this.wrapPointer(externalType, type.indirection);
      }

      return externalType;
    } else {
      switch (type.kind) {
        case 'Int':
          return Int32();
      }
    }
  }

  wrapPointer (type, level) {
    if (level === 0) {
      return type;
    }

    return this.wrapPointer(Pointer(type), level - 1);
  }
}

module.exports = Generator;
