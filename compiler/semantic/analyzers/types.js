// const {
//   MissingTypeAnnotationError,
//   TypeMismatchError
// } = require('../errors');

class TypeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const exprs = this.sourceGraph.outgoing(codeModule);

    exprs.forEach((n) => {
      this.analyzeType(n);
    });
  }

  analyzeType (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
      case 'mutable_declaration':
        return this.resolveDeclaration(node);
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

  resolveDeclaration (node) {
    const currentType = this.sourceGraph.relationFromNode(node, 'type');

    if (currentType[0]) {
      return currentType[0];
    }

    const exprNode = this.sourceGraph.relationFromNode(node, 'expression');
    const exprType = this.analyzeType(exprNode[0]);

    this.sourceGraph.addEdge(node, exprType, 'type');

    return exprType;
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
    if (node.attributes.kind) {
      const retType = this.associateType(node);
      this.sourceGraph.addEdge(node, retType, 'return_type');

      return retType;
    }

    const retType = this.buildType('void');
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
