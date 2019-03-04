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
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const exprs = this.sourceGraph.outgoing(codeModule);

    exprs.forEach((n) => {
      this.analyzeType(n);
    });
  }

  analyzeType (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        return this.resolveImmutableDeclaration(node);
      case 'mutable_declaration':
        return this.resolveMutableDeclaration(node);
      case 'variable_reference':
        return this.resolveReference(node);
      case 'boolean_literal':
      case 'number_literal':
      case 'string_literal':
        return this.associateType(node);
      case 'bin_op':
        return this.resolveBinop(node);
      case 'function':
        return this.resolveFunction(node);
      default:
    }
  }

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
    if (!exprNode[0]) {
      throw new Error();
    }

    const exprType = this.analyzeType(exprNode[0]);

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
        throw new TypeMismatchError(`Mutable variable \`${node.attributes.identifier}\` must have a type`);
      }
    }

    if (exprType) {
      // infer the type from this declarartion from the expression
      this.sourceGraph.addEdge(node, exprType, 'type');

      return exprType;
    } else {
      // use the annotation type
      this.sourceGraph.addEdge(node, annotatedType, 'type');

      return exprType;
    }
  }

  resolveReference (node) {
    const declNode = this.sourceGraph.relationFromNode(node, 'binding')[0];
    const typeNode = this.analyzeType(declNode);
    if (!typeNode) {
      throw new Error('BUG: Found a reference with no type');
    }

    return typeNode;
  }

  resolveBinop (node) {
    const lhs = this.sourceGraph.relationFromNode(node, 'left');
    const rhs = this.sourceGraph.relationFromNode(node, 'right');

    const lhsType = this.analyzeType(lhs[0]);
    const rhsType = this.analyzeType(rhs[0]);

    // both sides of the binop need to have equivilant types
    if (lhsType && rhsType) {
      return this.reconcileTypes(lhsType, rhsType);
    }
  }

  resolveFunction (node) {
    let retType = null;
    if (node.attributes.kind) {
      retType = this.associateType(node);

      const retTypes = this.analyzeReturnStatements(node);
      retTypes.forEach((n) => {
        if (n.attributes.kind !== retType.attributes.kind) {
          throw new MismatchedReturnTypeError(`Function \`${node.attributes.name}\` must return ${retType.attributes.kind}`);
        }
      });
    } else {
      retType = this.buildType('Void');
      const retTypes = this.analyzeReturnStatements(node);

      if (retTypes.length > 0) {
        throw new VoidFunctionReturnError(`Function \`${node.attributes.name}\` cannot return a value`);
      }
    }

    this.sourceGraph.addEdge(node, retType, 'return_type');

    return retType;
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

    const types = this.sourceGraph.search('type');
    const typeNode = types.find((n) => {
      return n.attributes.kind === typeClass;
    });

    if (!typeNode) {
      const buildType = this.sourceGraph.addNode({ type: 'type', kind: typeClass });
      return buildType;
    }

    return typeNode;
  }
}

module.exports = TypeAnalyzer;
