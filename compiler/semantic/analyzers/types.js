const { Query } = require('@novalang/graph');
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
    const sourceQuery = new Query(this.sourceGraph);
    const results = sourceQuery
      .match({ type: 'module' }, { name: 'modules'})
      .returns('modules');

    results.modules.forEach((n) => {
      this.analyzeModule(n);
    });
  }

  analyzeModule (node) {
    const query = new Query(this.sourceGraph);
    const result = query
      .find(node)
      .out('sources', { name: 'sources' })
      .returns('sources');

    result.sources.forEach((n) => {
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
      case 'method':
        return this.analyzeFunction(node);
      case 'return_statement':
        return this.analyzeReturn(node);
      case 'invocation':
        return this.analyzeInvocation(node);
      case 'instantiation':
        return this.analyzeInstantiation(node);
      case 'export_statement':
        return this.analyzeExport(node);
      case 'export_statement':
        return this.analyzeExport(node);
      case 'class_definition':
        return this.analyzeClass(node);
      case 'boolean_literal':
      case 'number_literal':
      case 'string_literal':
        return this.analyzeLiteral(node);
    }
  }

  analyzeDeclaration (declNode) {
    // check if this node already has a declared type (we've already seen it)
    const resolvedType = this.resolveType(declNode);
    if (resolvedType) {
      return resolvedType;
    }

    const annotatedType = this.associateType(declNode);

    const expressionQuery = new Query(this.sourceGraph);

    const result = expressionQuery
      .find(declNode)
      .out('expression', { name: 'expr' })
      .returns('expr');

    if (result.expr.length) {
      // resolve expression type
      const inferredType = this.analyzeType(result.expr[0]);

      // type match annotated to inferred
      if (annotatedType) {
        if (this.reconcileTypes(annotatedType, inferredType)) {
          this.sourceGraph.addEdge(declNode, inferredType, 'type');
          return inferredType;
        }

        throw new TypeMismatchError(`Variable \`${declNode.attributes.identifier}\` has expected type ${annotatedType.attributes.kind} but resolved to ${inferredType.attributes.kind}`);
      }

      this.sourceGraph.addEdge(declNode, inferredType, 'type');

      return inferredType;
    } else {
      // no expression, enforce annotated type
      if (annotatedType) {
        this.sourceGraph.addEdge(declNode, annotatedType, 'type');
        return annotatedType;
      }

      throw new MissingTypeAnnotationError(`Declaration of variable \`${declNode.attributes.identifier}\` requires a type annotation`);
    }
  }

  analyzeReference (refNode) {
    // resolve the type of this refs binding
    const bindingQuery = new Query(this.sourceGraph);
    const result = bindingQuery.find(refNode)
      .out('binding', { name: 'binding' })
      .returns('binding');

    const binding = result.binding[0];

    return this.analyzeType(binding);
  }

  analyzeBinop (binopNode) {
    let binopQuery = new Query(this.sourceGraph)
    const leftResult = binopQuery.find(binopNode)
      .out('left', { name: 'leftExpression' })
      .returns('leftExpression');

    const leftNode = leftResult.leftExpression[0];
    const leftResolved = this.analyzeType(leftNode);

    binopQuery = new Query(this.sourceGraph)
    const rightResult = binopQuery.find(binopNode)
      .out('right', { name: 'rightExpression'})
      .returns('rightExpression');

    const rightNode = rightResult.rightExpression[0];
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
    const funcArgs = new Query(this.sourceGraph);
    const argResult = funcArgs
      .find(funcNode)
      .out('arguments', { name: 'args' })
      .returns('args');

    argResult.args.forEach((n) => {
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
    const funcBodyQuery = new Query(this.sourceGraph);
    const funcResult = funcBodyQuery
      .find(funcNode)
      .out('body', { name: 'bodySource' })
      .returns('bodySource');

    funcResult.bodySource.forEach((n) => {
      this.analyzeType(n);
    });

    // check the return statements type
    const retQuery = new Query(this.sourceGraph);
    const retResult = retQuery.find(funcNode)
      .out()
      .search({ type: 'return_statement' }, { name: 'returnStatements' })
      .returns('returnStatements');

    // reconsile types of all return statements in the func body
    retResult.returnStatements.reduce((finalType, retNode) => {
      const retType = this.analyzeType(retNode);


      if (!this.reconcileTypes(finalType, retType)) {
        if (funcType.attributes.kind === 'Void') {
          throw new VoidFunctionReturnError(`Void function \`${funcNode.attributes.identifier}\` is not allowed to return a value`);
        }

        throw new MismatchedReturnTypeError(`Type mismatch in function \`${funcNode.attributes.identifier}\`. Returned type \`${retType.attributes.kind}\` is not compatible with declared type \`${funcNode.attributes.kind}\``);
      }

      return finalType;
    }, funcType);

    return funcType;
  }

  analyzeReturn (retNode) {
    const retTypeQuery = new Query(this.sourceGraph);
    const result = retTypeQuery
      .find(retNode)
      .out('expression', { name: 'statement' })
      .returns('statement');

    const retStatement = result.statement[0];

    return this.analyzeType(retStatement);
  }

  analyzeInvocation (invokeNode) {
    const invokeQuery = new Query(this.sourceGraph);
    const result = invokeQuery
      .find(invokeNode)
      .out('binding', { name: 'binding' })
      .returns('binding');

    const funcNode = result.binding[0];

    return this.analyzeType(funcNode);
  }

  analyzeInstantiation(instNode) {
    console.log('type inst');
    console.log(instNode);
  }

  analyzeExport (exportNode) {
    const query = new Query(this.sourceGraph);
    const result = query
      .find(exportNode)
      .out(null, { name: 'export' })
      .returns('export');

    const funcNode = result.export[0];

    return this.analyzeType(funcNode);
  }

  analyzeClass (classNode) {
    // check if this node already has a declared type (we've already seen it)
    const resolvedType = this.resolveType(classNode);
    if (resolvedType) {
      return resolvedType;
    }

    const classType = this.buildType(classNode.attributes.kind);
    this.sourceGraph.addEdge(classNode, classType, 'type');

    // analyze methods
    const methodsQuery = new Query(this.sourceGraph);
    const methodResult = methodsQuery
      .find(classNode)
      .out('body')
      .where({ type: 'method' }, { name: 'methods' })
      .returns('methods');

    methodResult.methods.forEach((methodNode) => {
      this.analyzeType(methodNode);
    });
  }

  analyzeLiteral (literalNode) {
    const type = this.associateType(literalNode);

    this.sourceGraph.addEdge(literalNode, type, 'type');

    return type;
  }

  // helper functions

  resolveType (typedNode) {
    // check if this node has an already computed type
    const typeQuery = new Query(this.sourceGraph)
    const result = typeQuery
      .find(typedNode)
      .out('type', { name: 'resolvedType' })
      .returns('resolvedType');

    if (result.resolvedType.length) {
      return result.resolvedType[0];
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

    const typeQuery = new Query(this.sourceGraph);
    const result = typeQuery
      .match({ type: 'type', kind: typeClass }, { name: 'type' })
      .returns('type');

    if (result.type && result.type[0]) {
      return result.type[0];
    } else {
      const buildType = this.sourceGraph.addNode({ type: 'type', kind: typeClass });
      return buildType;
    }
  }
}

module.exports = TypeAnalyzer;
