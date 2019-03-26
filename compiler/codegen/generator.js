const Builder = require('./llvm/builder');
const BuildUnit = require('./build-unit');
const Func = require('./llvm/function');
const Module = require('./llvm/module');
const Parameter = require('./llvm/parameter');

// TODO: remove this and factor branch code info llvm helper
const { libLLVM } = require('llvm-ffi');

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

    const moduleFunc = new Func(llvmMod, this.codeModule.attributes.name, Void(), [], false);
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
      case 'export_statement':
        return this.codeGenExport(node);
      case 'conditional_branch':
        return this.codegenConditional(node);
      case 'else_expression':
        return this.codegenElseCondition(node);
      case 'variable_reference':
        return this.codegenReference(node);
      case 'return_statement':
        return this.codegenReturn(node);
      case 'immutable_declaration':
        return this.codegenVar(node);
      case 'invocation':
        return this.codegenInvocation(node);
      case 'bin_op':
        return this.codegenBinop(node);
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

    const mainFunc = new Func(this.module, 'main', Int32(), params, false);

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

    const func = new Func(this.module, funcName, retType, argTypes, false);
    this.builder.enter(func);

    func.paramRefs().forEach((p) => {
      this.builder.namedValues[p.name] = p.ref;
    });

    // build function body
    const bodyNodes = this.sourceGraph.relationFromNode(funcNode, 'body');
    bodyNodes.forEach((n) => this.codegenNode(n));

    // check for return
    // TODO move this into parser or analyzer?
    const retNode = bodyNodes.find((n) => n.attributes.type === 'return_statement');

    if (!retNode) {
      this.builder.buildRet(Constant(Int32(), 0));
    }

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

    return new Func(this.module, funcName, retType, argTypes, variadic !== undefined, true);
  }

  codeGenImports (node) {
    const imports = this.sourceGraph.relationFromNode(node, 'import');
    imports.forEach((i) => {
      const importFunc = this.sourceGraph.relationFromNode(i, 'binding')[0];
      this.codegenNode(importFunc);
    });
  }

  codeGenExport (node) {
    const exportExpr = this.sourceGraph.relationFromNode(node, 'expression')[0];
    return this.codegenNode(exportExpr);
  }

  codegenReturn (node) {
    // get the return expression
    const retNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    // code gen expression
    const expr = this.codegenNode(retNode);

    this.builder.buildRet(expr);
  }

  codegenConditional (node) {
    // ref to current function for block creation and movement
    const func = libLLVM.LLVMGetBasicBlockParent(libLLVM.LLVMGetInsertBlock(this.builder.builderRef));

    const finalBlock = libLLVM.LLVMAppendBasicBlock(func, 'finalBlock');

    const conditions = this.sourceGraph.relationFromNode(node, 'conditions');
    conditions.forEach((cond, index) => {
      const last = index === conditions.length - 1;
      const testNode = this.sourceGraph.relationFromNode(cond, 'test')[0];
      const testExpr = this.codegenNode(testNode);

      // gen then and else blocks
      const thenBlock = libLLVM.LLVMAppendBasicBlock(func, 'thenBlock');
      const elseBlock = libLLVM.LLVMAppendBasicBlock(func, 'elseBlock');
      const mergeBlock = libLLVM.LLVMAppendBasicBlock(func, 'mergeBlock');

      // TODO: try and use LLVMInsertBasicBlock instead
      libLLVM.LLVMMoveBasicBlockBefore(thenBlock, finalBlock);
      libLLVM.LLVMMoveBasicBlockBefore(elseBlock, finalBlock);
      libLLVM.LLVMMoveBasicBlockBefore(mergeBlock, finalBlock);

      libLLVM.LLVMBuildCondBr(this.builder.builderRef, testExpr, thenBlock, elseBlock);

      // gen then
      libLLVM.LLVMPositionBuilderAtEnd(this.builder.builderRef, thenBlock);
      const thenNode = this.sourceGraph.relationFromNode(cond, 'body')[0];
      this.codegenNode(thenNode);
      libLLVM.LLVMBuildBr(this.builder.builderRef, finalBlock);

      if (last) {
        // last branch in the condition is always the else (if one is defined)
        libLLVM.LLVMPositionBuilderAtEnd(this.builder.builderRef, elseBlock);
        const elseNode = this.sourceGraph.relationFromNode(node, 'else')[0];
        this.codegenNode(elseNode);
        libLLVM.LLVMBuildBr(this.builder.builderRef, finalBlock);

        // TODO:
        // in the final else block we dont need the trailing merge block
        // libLLVM.LLVMDeleteBasicBlock(mergeBlock);
        // and remove the following useless jump
        libLLVM.LLVMPositionBuilderAtEnd(this.builder.builderRef, mergeBlock);
        libLLVM.LLVMBuildBr(this.builder.builderRef, finalBlock);
      } else {
        // in an else/if branch, the "else" basic block is empty so we
        // jump immediately to the merge for the next condition to start
        libLLVM.LLVMPositionBuilderAtEnd(this.builder.builderRef, elseBlock);
        libLLVM.LLVMBuildBr(this.builder.builderRef, mergeBlock);
      }

      libLLVM.LLVMPositionBuilderAtEnd(this.builder.builderRef, mergeBlock);
    });

    libLLVM.LLVMPositionBuilderAtEnd(this.builder.builderRef, finalBlock);
  }

  codegenElseCondition (node) {
    const bodyNode = this.sourceGraph.relationFromNode(node, 'body')[0];
    return this.codegenNode(bodyNode);
  }

  codegenVar (node) {
    const typeNode = this.sourceGraph.relationFromNode(node, 'type')[0];
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    const varRef = this.builder.buildAlloc(this.getType(typeNode), node.attributes.identifier);
    const expr = this.codegenNode(exprNode);

    this.builder.buildStore(varRef, expr);
  }

  codegenReference (node) {
    const binding = this.sourceGraph.relationFromNode(node, 'binding')[0];

    if (binding.attributes.type === 'function_argument') {
      return this.builder.namedValues[binding.attributes.identifier];
    }

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

  codegenBinop (node) {
    const op = node.attributes.operator;
    const lhs = this.sourceGraph.relationFromNode(node, 'left')[0];
    const rhs = this.sourceGraph.relationFromNode(node, 'right')[0];

    // codegen both sides
    const lhsRef = this.codegenNode(lhs);
    const rhsRef = this.codegenNode(rhs);

    switch (op) {
      case '+':
        return this.builder.buildAdd(lhsRef, rhsRef, 'addexpr');
      case '-':
        return this.builder.buildSub(lhsRef, rhsRef, 'subexpr');
      case '*':
        return this.builder.buildMul(lhsRef, rhsRef, 'mulexpr');
      case '/':
        return this.builder.buildDiv(lhsRef, rhsRef, 'divexpr');
      case '>':
        return this.builder.buildCompareGT(lhsRef, rhsRef, 'gtcmp');
      case '<':
        return this.builder.buildCompareLT(lhsRef, rhsRef, 'ltcmp');
      case '>=':
        return this.builder.buildCompareGTE(lhsRef, rhsRef, 'gtecmp');
      case '<=':
        return this.builder.buildCompareLTE(lhsRef, rhsRef, 'ltecmp');
    }
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
      case 'Void':
        return Void();
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
