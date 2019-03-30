const Builder = require('./llvm/builder');
const BuildUnit = require('./build-unit');
const Func = require('./llvm/function');
const Class = require('./llvm/class');
const Module = require('./llvm/module');
const Parameter = require('./llvm/parameter');

const { libLLVM } = require('llvm-ffi');

const {
  Constant,
  Int1,
  Int8,
  Int32,
  Pointer,
  Struct,
  Void
} = require('./llvm/types');

class Generator {
  constructor (buildDir, sourceGraph, codeModule) {
    this.buildDir = buildDir;
    this.sourceGraph = sourceGraph;
    this.codeModule = codeModule;

    this.builder = new Builder();
    this.module = this.codegenModule();
    this.typeMap = {};
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
      case 'assignment':
        return this.codegenAssignment(node);
      case 'class_definition':
        return this.codegenClass(node);
      case 'instantiation':
        return this.codegenInstantiation(node);
      case 'function':
        return this.codeGenFunction(node);
      case 'method':
        return this.codeGenMethod(node);
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
      case 'mutable_declaration':
        return this.codegenVar(node);
      case 'invocation':
        return this.codegenInvocation(node);
      case 'bin_op':
        return this.codegenBinop(node);
      case 'while_loop':
        return this.codegenWhileLoop(node);
      case 'do_while_loop':
        return this.codegenDoWhileLoop(node);
      case 'number_literal':
      case 'string_literal':
      case 'boolean_literal':
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

  codegenAssignment (node) {
    const assign = this.sourceGraph.relationFromNode(node, 'left')[0];
    const expr = this.sourceGraph.relationFromNode(node, 'right')[0];

    const exprRef = this.codegenNode(expr);

    this.builder.buildStore(assign.attributes.identifier, exprRef);
  }

  codegenClass (node) {
    const className = node.attributes.identifier;
    const classIdentifier = `__${className}`;

    const aClass = new Class(this.module, classIdentifier);
    this.builder.setClass(aClass);
    this.builder.enter(aClass);

    // build the type
    const classType = new Struct(node.attributes.kind);
    const ivars = this.sourceGraph.relationFromNode(node, 'instance_variables');

    const structTypes = ivars.map((t) => this.getType(t));

    libLLVM.LLVMStructSetBody(classType, structTypes, structTypes.length, 0);

    // save type
    this.typeMap[className] = classType;

    // build function body
    const bodyNodes = this.sourceGraph.relationFromNode(node, 'body');
    bodyNodes.forEach((n) => this.codegenNode(n));

    this.builder.buildVoidRet();

    this.builder.currentClass = null;
    this.builder.exit();
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

  // TODO: consolidate this with codeGenFunction
  codeGenMethod (node) {
    const currentClass = this.builder.currentClass;

    const methodName = `${currentClass.name}_${node.attributes.name}`;

    const typeNode = this.sourceGraph.relationFromNode(node, 'return_type')[0];
    const retType = this.getType(typeNode);

    // build argument type list
    const argTypes = this.sourceGraph.relationFromNode(node, 'arguments').map((n) => {
      const typeNode = this.sourceGraph.relationFromNode(n, 'type')[0];
      return new Parameter(n.attributes.identifier, this.getType(typeNode));
    });

    const func = new Func(this.module, methodName, retType, argTypes, false);
    this.builder.enter(func);

    func.paramRefs().forEach((p) => {
      this.builder.namedValues[p.name] = p.ref;
    });

    // build function body
    const bodyNodes = this.sourceGraph.relationFromNode(node, 'body');
    bodyNodes.forEach((n) => this.codegenNode(n));

    // check for return
    // TODO move this into parser or analyzer?
    const retNode = bodyNodes.find((n) => n.attributes.type === 'return_statement');

    if (!retNode) {
      this.builder.buildRet(Constant(Int32(), 0));
    }

    this.builder.exit();
  }

  codegenInstantiation (node) {
    const currentClass = this.sourceGraph.relationFromNode(node, 'binding')[0];
    const classConstructor = `__${currentClass.attributes.identifier}`;

    const funcRef = this.module.getNamedFunction(classConstructor);

    // build argument type list
    const argTypes = this.sourceGraph.relationFromNode(node, 'arguments').map((n) => {
      return this.codegenNode(n);
    });

    return this.builder.buildCall(funcRef, argTypes, classConstructor);
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
    const finalBlock = this.builder.insertBlock('finalBlock');

    const conditions = this.sourceGraph.relationFromNode(node, 'conditions');
    conditions.forEach((cond, index) => {
      const last = index === conditions.length - 1;
      const testNode = this.sourceGraph.relationFromNode(cond, 'test')[0];
      const testExpr = this.codegenNode(testNode);

      // gen then and else blocks
      const thenBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'thenBlock');
      const elseBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'elseBlock');
      const mergeBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'mergeBlock');

      this.builder.buildConditionalBranch(testExpr, thenBlock, elseBlock);

      // gen then
      this.builder.positionAt(thenBlock);
      const thenNode = this.sourceGraph.relationFromNode(cond, 'body')[0];
      this.codegenNode(thenNode);
      this.builder.buildBranch(finalBlock);

      if (last) {
        // last branch in the condition is always the else (if one is defined)
        this.builder.positionAt(elseBlock);
        const elseNode = this.sourceGraph.relationFromNode(node, 'else')[0];
        if (elseNode) {
          this.codegenNode(elseNode);
        }

        this.builder.buildBranch(finalBlock);

        // TODO:
        // in the final else block we dont need the trailing merge block
        // libLLVM.LLVMDeleteBasicBlock(mergeBlock);
        // and remove the following useless jump
        this.builder.positionAt(mergeBlock);
        this.builder.buildBranch(finalBlock);
      } else {
        // in an else/if branch, the "else" basic block is empty so we
        // jump immediately to the merge for the next condition to start
        this.builder.positionAt(elseBlock);
        this.builder.buildBranch(mergeBlock);
      }

      this.builder.positionAt(mergeBlock);
    });

    this.builder.positionAt(finalBlock);
  }

  codegenElseCondition (node) {
    const bodyNode = this.sourceGraph.relationFromNode(node, 'body')[0];
    return this.codegenNode(bodyNode);
  }

  codegenVar (node) {
    const typeNode = this.sourceGraph.relationFromNode(node, 'type')[0];
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];

    this.builder.buildAlloc(this.getType(typeNode), node.attributes.identifier);

    const expr = this.codegenNode(exprNode);

    this.builder.buildStore(node.attributes.identifier, expr);
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
      case '==':
        return this.builder.buildCompareEQ(lhsRef, rhsRef, 'eqcmp');
      case '!=':
        return this.builder.buildCompareNEQ(lhsRef, rhsRef, 'neqcmp');
    }
  }

  codegenWhileLoop (node) {
    const testNode = this.sourceGraph.relationFromNode(node, 'test')[0];
    const bodyNodes = this.sourceGraph.relationFromNode(node, 'body');

    const finalBlock = this.builder.insertBlock('finalBlock');

    // build test condition block
    const testBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'testBlock');
    const bodyBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'bodyBlock');

    // enter loop
    this.builder.buildBranch(testBlock);
    this.builder.positionAt(testBlock);

    const testRef = this.codegenNode(testNode);
    this.builder.buildConditionalBranch(testRef, bodyBlock, finalBlock);

    this.builder.positionAt(bodyBlock);
    bodyNodes.forEach((body) => {
      this.codegenNode(body);
    });

    // jump back to the test block for the next iteration
    this.builder.buildBranch(testBlock);

    // finish
    this.builder.positionAt(finalBlock);
  }

  codegenDoWhileLoop (node) {
    const testNode = this.sourceGraph.relationFromNode(node, 'test')[0];
    const bodyNodes = this.sourceGraph.relationFromNode(node, 'body');

    const finalBlock = this.builder.insertBlock('finalBlock');

    // build test condition block
    const testBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'testBlock');
    const bodyBlock = this.builder.insertBlockBeforeBlock(finalBlock, 'bodyBlock');

    this.builder.buildBranch(bodyBlock);
    this.builder.positionAt(bodyBlock);

    bodyNodes.forEach((body) => {
      this.codegenNode(body);
    });

    // jump into the test after the first iteration
    this.builder.buildBranch(testBlock);
    this.builder.positionAt(testBlock);

    const testRef = this.codegenNode(testNode);
    this.builder.buildConditionalBranch(testRef, bodyBlock, finalBlock);

    // finish
    this.builder.positionAt(finalBlock);
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
      case 'Boolean':
        const value = node.attributes.value === 'true' ? 1 : 0;
        return Constant(this.getType(node), value);
      case 'String':
        return this.builder.buildGlobalString('format', node.attributes.value);
    }
  }

  getType (typeNode) {
    switch (typeNode.attributes.kind) {
      case 'Int':
        return Int32();
      case 'Boolean':
        return Int1();
      case 'Void':
        return Void();
    }

    if (this.typeMap[typeNode.attributes.kind]) {
      return this.typeMap[typeNode.attributes.kind];
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
