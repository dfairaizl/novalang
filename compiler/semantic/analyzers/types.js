const {
  DuplicateTypeError,
  MissingTypeAnnotationError,
  TypeMismatchError,
  MismatchedReturnTypeError,
  VoidAssignmentError,
  VoidFunctionReturnError
} = require('../errors');

class TypeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    // TODO: Install the build in types so we don't need to create them via strings

    const sourceQuery = this.sourceGraph.query();
    const modules = sourceQuery
      .match({ type: 'module' })
      .execute();

    modules.nodes().forEach((n) => {
      this.analyzeModule(n);
    });
  }

  analyzeModule (node) {
    const query = this.sourceGraph.query();
    query
      .begin(node)
      .outgoing('sources')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    query.nodes().forEach((n) => {
      this.analyzeType(n);
    });
  }

  analyzeType (node) {
    switch (node.attributes.type) {
      case 'function_argument':
      case 'immutable_declaration':
      case 'mutable_declaration':
        return this.analyzeDeclaration(node);
      case 'variable_reference':
        return this.analyzeReference(node);
      case 'bin_op':
        return this.analyzeBinop(node);
      case 'function':
        return this.analyzeFunction(node);
      case 'return_statement':
        return this.analyzeReturn(node);
      case 'invocation':
        return this.analyzeInvocation(node);
      case 'boolean_literal':
      case 'number_literal':
      case 'string_literal':
        return this.analyzeLiteral(node);
      default:
    }
    // switch (node.attributes.type) {
    //   case 'immutable_declaration':
    //     return this.resolveImmutableDeclaration(node);
    //   case 'mutable_declaration':
    //     return this.resolveMutableDeclaration(node);
    //   case 'instantiation':
    //     return this.resolveInstantiation(node);
    //   case 'class_definition':
    //     return this.resolveClass(node);
    //   case 'variable_reference':
    //     return this.resolveReference(node);
    //   case 'function_argument':
    //     return this.resolveArgument(node);
    //   case 'bin_op':
    //     return this.resolveBinop(node);
    //   case 'function':
    //   case 'external_function':
    //   case 'method':
    //   case 'constructor':
    //     return this.resolveFunction(node);
    //   case 'assignment':
    //     return this.resolveAssignment(node);
    //   case 'invocation':
    //     return this.resolveInvocation(node);
    //   case 'instance_reference':
    //     return this.resolveInstanceReference(node);
    //   case 'import_statement':
    //     return this.resolveImport(node);
    //   case 'import_declaration':
    //     return this.resolveImportDeclaration(node);
    //   default:
    //     console.error('Unknown type', node.attributes.type);
    // }
  }

  analyzeDeclaration (declNode) {
    // check if this node already has a declared type (we've already seen it)
    const resolvedType = this.resolveType(declNode);
    if (resolvedType) {
      return resolvedType;
    }

    const annotatedType = this.associateType(declNode);

    const expressionQuery = this.sourceGraph.query();
    expressionQuery.begin(declNode)
      .outgoing('expression')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    if (expressionQuery.nodes().length) {
      // resolve expression type
      const inferredType = this.analyzeType(expressionQuery.nodes()[0]);

      // type match annotated to inferred
      if (annotatedType) {
        if (this.reconcileTypes(annotatedType, inferredType)) {
          this.sourceGraph.addEdge(declNode, inferredType, 'type');
          return inferredType;
        }

        throw new TypeMismatchError(`Variable \`${declNode.attributes.identifier}\` has expected type ${annotatedType.attributes.kind} but resolved to ${inferredType.attributes.kind}`);
      }

      if (inferredType) {
        this.sourceGraph.addEdge(declNode, inferredType, 'type');
        return inferredType;
      }
    } else {
      // no expression, enforce annotated type
      if (annotatedType) {
        this.sourceGraph.addEdge(declNode, annotatedType, 'type');
        return annotatedType;
      }

      throw new MissingTypeAnnotationError(`Declaration of variable \`${declNode.attributes.identifier}\` requires a type annotation`);
    }

    throw new Error('Incomplete type implementation');
  }

  analyzeReference (refNode) {
    // resolve the type of this refs binding
    const bindingQuery = this.sourceGraph.query();
    bindingQuery.begin(refNode)
      .outgoing('binding')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const binding = bindingQuery.nodes()[0];
    if (binding) {
      return this.analyzeType(binding);
    }
  }

  analyzeBinop (binopNode) {
    let binopQuery = this.sourceGraph.query();
    binopQuery.begin(binopNode)
      .outgoing('left')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const leftNode = binopQuery.nodes()[0];
    const leftResolved = this.analyzeType(leftNode);

    binopQuery = this.sourceGraph.query();
    binopQuery.begin(binopNode)
      .outgoing('right')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const rightNode = binopQuery.nodes()[0];
    const rightResolved = this.analyzeType(rightNode);

    const resolvedType = this.reconcileTypes(leftResolved, rightResolved);

    if (!resolvedType) {
      throw new TypeMismatchError(`Type mismatch in expression \`${leftResolved.attributes.kind}\` is not compatible with \`${rightResolved.attributes.kind}\``);
    }

    return resolvedType;
  }

  analyzeFunction (funcNode) {
    debugger;
    // check if this node already has a declared type (we've already seen it)
    const resolvedType = this.resolveType(funcNode);
    if (resolvedType) {
      return resolvedType;
    }

    // analyze function parameters
    const funcArgs = this.sourceGraph.query();
    funcArgs
      .begin(funcNode)
      .outgoing('arguments')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    funcArgs.nodes().forEach((n) => {
      if (!n.attributes.kind) {
        throw new MissingTypeAnnotationError(`Parameter \`${n.attributes.identifier}\` in function \`${funcNode.attributes.identifier}\` must have a declared type`);
      }

      const argType = this.associateType(n);
      this.sourceGraph.addEdge(n, argType, 'type');
    });

    // get the functions return type from the annotation (or assume Void)
    let funcType;

    if (funcNode.attributes.kind) {
      funcType = this.buildType(funcNode.attributes.kind);
    } else {
      funcType = this.buildType('Void');
    }

    this.sourceGraph.addEdge(funcNode, funcType, 'type');

    // analyze function body statements
    const funcBodyQuery = this.sourceGraph.query();
    funcBodyQuery
      .begin(funcNode)
      .outgoing('body')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    funcBodyQuery.nodes().forEach((n) => {
      this.analyzeType(n);
    });

    // check the return statements type
    const retQuery = this.sourceGraph.query();
    retQuery.begin(funcNode)
      .outgoing()
      .any({ maxDepth: 1 })
      .match({ type: 'return_statement' })
      .execute();

    const retNode = retQuery.nodes()[0];
    if (retNode) {
      const retType = this.analyzeType(retNode);

      if (!this.reconcileTypes(funcType, retType)) {
        if (funcType.attributes.kind === 'Void') {
          throw new VoidFunctionReturnError(`Void function \`${funcNode.attributes.identifier}\` is not allowed to return a value`);
        }

        throw new MismatchedReturnTypeError(`Type mismatch in function \`${funcNode.attributes.identifier}\`. Returned type \`${retType.attributes.kind}\` is not compatible with declared type \`${funcNode.attributes.kind}\``);
      }
    }

    return funcType;
  }

  analyzeReturn (retNode) {
    const resolvedType = this.resolveType(retNode);
    if (resolvedType) {
      return resolvedType;
    }

    const retTypeQuery = this.sourceGraph.query();
    retTypeQuery
      .begin(retNode)
      .outgoing()
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const retStatement = retTypeQuery.nodes()[0];
    if (retStatement) {
      return this.analyzeType(retStatement);
    }
  }

  analyzeInvocation (invokeNode) {
    const resolvedType = this.resolveType(invokeNode);
    if (resolvedType) {
      return resolvedType;
    }

    const invokeQuery = this.sourceGraph.query();
    invokeQuery
      .begin(invokeNode)
      .outgoing('binding')
      .any()
      .matchAll()
      .execute();

    const funcNode = invokeQuery.nodes()[0];
    if (funcNode) {
      return this.analyzeType(funcNode);
    }
  }

  analyzeLiteral (literalNode) {
    const type = this.associateType(literalNode);

    this.sourceGraph.addEdge(literalNode, type, 'type');

    return type;
  }

  // //////////////////// HELPERS ///////////////////

  resolveType (typedNode) {
    // check if this node has an already computed type
    const typeQuery = this.sourceGraph.query();
    typeQuery.begin(typedNode)
      .outgoing('type')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    if (typeQuery.nodes().length === 1) {
      return typeQuery.nodes()[0];
    }

    return null;
  }

  // ////////////////////////// DEPRECATED ////////////////////////////////////

  analyzeReturnStatements (node) {
    const retStatements = this.sourceGraph.outgoing(node).filter((n) => {
      return n.attributes.type === 'return_statement';
    });

    return retStatements.map((n) => {
      const expr = this.sourceGraph.relationFromNode(n, 'expression');
      return this.analyzeType(expr[0]);
    });
  }

  resolveImmutableDeclaration (node) {
    const currentType = this.sourceGraph.relationFromNode(node, 'type');

    if (currentType[0]) {
      return currentType[0];
    }

    const exprNode = this.sourceGraph.relationFromNode(node, 'expression');
    const exprType = this.analyzeType(exprNode[0]);

    if (exprType.attributes.kind === 'Void') {
      throw new VoidAssignmentError(`Variable \`${node.attributes.identifier}\` cannot have type Void`);
    }

    this.sourceGraph.addEdge(node, exprType, 'type');

    return exprType;
  }

  resolveMutableDeclaration (node) {
    const currentType = this.sourceGraph.relationFromNode(node, 'type');

    if (currentType[0]) {
      return currentType[0];
    }

    let exprType = null;
    const annotatedType = this.buildType(node.attributes.kind);

    const exprNode = this.sourceGraph.relationFromNode(node, 'expression');

    if (exprNode[0]) {
      exprType = this.analyzeType(exprNode[0]);
    }

    if (!exprType && !annotatedType) { // no expression, annotation required
      throw new MissingTypeAnnotationError(`Mutable variable \`${node.attributes.identifier}\` must have a type`);
    }

    if (exprType && annotatedType) { // annotation and expression type present
      const recType = this.reconcileTypes(annotatedType, exprType);
      if (!recType) {
        throw new TypeMismatchError(`Mutable variable \`${node.attributes.identifier}\` must have a valid type`);
      }
    }

    if (exprType) {
      if (exprType.attributes.kind === 'Void') {
        throw new VoidAssignmentError(`Variable \`${node.attributes.identifier}\` cannot have type Void`);
      }

      // infer the type from this declarartion from the expression
      this.sourceGraph.addEdge(node, exprType, 'type');

      return exprType;
    } else {
      // use the annotation type
      this.sourceGraph.addEdge(node, annotatedType, 'type');

      return exprType;
    }
  }

  resolveArgument (node) {
    if (node.attributes.kind) {
      const argType = this.associateType(node);

      // if (this.sourceGraph.relationFromNode(node, 'type')[0]) {
      //   return this.sourceGraph.relationFromNode(node, 'type')[0];
      // }

      this.sourceGraph.addEdge(node, argType, 'type');

      return argType;
    }

    throw new MissingTypeAnnotationError(`Function argument \`${node.attributes.identifier}\` must have a type`);
  }

  resolveClass (node) {
    const typeClass = node.attributes.kind;

    const types = this.sourceGraph.search('type');
    const typeNode = types.find((n) => {
      return n.attributes.kind === typeClass;
    });

    if (!typeNode) {
      const buildType = this.sourceGraph.addNode({ type: 'type', kind: typeClass });

      this.sourceGraph.addEdge(node, buildType, 'type');

      // analyze the instance vars
      const ivars = this.sourceGraph.relationFromNode(node, 'instance_variables');
      ivars.forEach((v) => this.analyzeType(v));

      // analyze the class methods
      const methods = this.sourceGraph.relationFromNode(node, 'body');
      methods.forEach((m) => this.analyzeType(m));

      return buildType;
    }

    throw new DuplicateTypeError(`Type \`${typeClass}\` has already been defined.`);
  }

  resolveInstantiation (node) {
    const classNode = this.sourceGraph.relationFromNode(node, 'binding')[0];
    return this.sourceGraph.relationFromNode(classNode, 'type')[0];
  }

  resolveReference (node) {
    const declNode = this.sourceGraph.relationFromNode(node, 'binding')[0];
    return this.analyzeType(declNode);
  }

  resolveInstanceReference (node) {
    const declNode = this.sourceGraph.relationFromNode(node, 'binding')[0];
    return this.analyzeType(declNode);
  }

  resolveAssignment (node) {
    const lhs = this.sourceGraph.relationFromNode(node, 'left');
    const rhs = this.sourceGraph.relationFromNode(node, 'right');

    const lhsType = this.analyzeType(lhs[0]);
    const rhsType = this.analyzeType(rhs[0]);

    // both sides of the binop need to have equivilant types
    const recType = this.reconcileTypes(lhsType, rhsType);

    if (!recType) {
      throw new TypeMismatchError(`Operands must have the same type`);
    }

    return recType;
  }

  resolveBinop (node) {
    const lhs = this.sourceGraph.relationFromNode(node, 'left');
    const rhs = this.sourceGraph.relationFromNode(node, 'right');

    const lhsType = this.analyzeType(lhs[0]);
    const rhsType = this.analyzeType(rhs[0]);

    // both sides of the binop need to have equivilant types
    const recType = this.reconcileTypes(lhsType, rhsType);

    if (!recType) {
      throw new TypeMismatchError(`Operands must have the same type`);
    }

    return recType;
  }

  resolveFunction (node) {
    let retType = null;

    if (this.sourceGraph.relationFromNode(node, 'return_type')[0]) {
      return this.sourceGraph.relationFromNode(node, 'return_type')[0];
    }

    const argNodes = this.sourceGraph.relationFromNode(node, 'arguments');
    argNodes.forEach((n) => this.analyzeType(n));

    if (node.attributes.kind) {
      retType = this.associateType(node);
      this.sourceGraph.addEdge(node, retType, 'return_type');

      const retTypes = this.analyzeReturnStatements(node);
      retTypes.forEach((n) => {
        if (n.attributes.kind !== retType.attributes.kind) {
          throw new MismatchedReturnTypeError(`Function \`${node.attributes.name}\` must return ${retType.attributes.kind}`);
        }
      });
    } else {
      retType = this.buildType('Void');
      this.sourceGraph.addEdge(node, retType, 'return_type');

      const retTypes = this.analyzeReturnStatements(node);

      if (retTypes.length > 0) {
        throw new VoidFunctionReturnError(`Function \`${node.attributes.name}\` cannot return a value`);
      }
    }

    // TODO: NEEDS TESTS
    const bodyNodes = this.sourceGraph.relationFromNode(node, 'body');
    bodyNodes.forEach((n) => this.analyzeType(n));

    return retType;
  }

  resolveInvocation (node) {
    const funcNode = this.sourceGraph.relationFromNode(node, 'binding')[0];

    // check if the bound functin has already been analyzed
    // this is the case for recursive functions
    const funcType = this.sourceGraph.relationFromNode(funcNode, 'return_type');
    if (funcType[0]) {
      return funcType[0];
    }

    return this.analyzeType(funcNode);
  }

  resolveImportDeclaration (node) {
    const funcNode = this.sourceGraph.relationFromNode(node, 'binding')[0];
    return this.analyzeType(funcNode);
  }

  resolveImport (node) {
    const importDecls = this.sourceGraph.relationFromNode(node, 'import');
    importDecls.forEach((node) => {
      const bindingNode = this.sourceGraph.relationFromNode(node, 'binding');
      const exprType = this.analyzeType(bindingNode[0]);

      this.sourceGraph.addEdge(node, exprType, 'type');

      return exprType;
    });
  }

  reconcileTypes (type1, type2) {
    // check for equivilance (type precedence) or the ability to cast
    if (type1.attributes.kind === type2.attributes.kind) {
      return type1;
    }

    return null;
  }

  associateType (node) {
    return this.buildType(node.attributes.kind);
  }

  buildType (typeClass) {
    if (!typeClass) {
      return null;
    }

    const typeQuery = this.sourceGraph.query();
    typeQuery
      .match({ type: 'type', kind: typeClass })
      .execute();

    if (typeQuery.nodes()[0]) {
      return typeQuery.nodes()[0];
    } else {
      const buildType = this.sourceGraph.addNode({ type: 'type', kind: typeClass });
      return buildType;
    }
  }
}

module.exports = TypeAnalyzer;
