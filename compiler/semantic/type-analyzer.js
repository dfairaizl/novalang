class BaseType {
  constructor (kind, types) {
    this.kind = kind;
    this.types = types;
  }
}

class NumberType extends BaseType {}

class TypeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
    this.env = {};
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');

    const adj = this.sourceGraph.adjacencyList[codeModule.id];
    adj.edges.forEach((e) => {
      const node = e.target;
      this.analyzeNode(node);
    });

    console.log(require('util').inspect(this.sourceGraph.treeFromNode(codeModule), { depth: null }));
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        return this.typeGenVar(node);
      case 'number_literal':
        return this.typeGenNumber(node);
      default:
        console.log('Unknown expression', node.attributes.type);
    }
  }

  typeGenVar (node) {
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];
    let typeVal = this.analyzeNode(exprNode);

    // check against declared annotation if any
    if (node.attributes.kind) {
      // unify the types and update typeVal if constraints are solvable
    }

    // this node has the inferred type of its expression value
    node.attributes.kind = typeVal.kind;

    console.log('GEN TYPE', typeVal);
  }

  typeGenNumber (node) {
    return new NumberType(node.attributes.kind);
  }
}

module.exports = TypeAnalyzer;
