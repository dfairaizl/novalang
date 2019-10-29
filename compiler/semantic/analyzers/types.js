const {
  MissingTypeAnnotationError,
  TypeMismatchError,
  MismatchedReturnTypeError,
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

  // helper functions

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
