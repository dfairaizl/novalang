const {
  ReassignImmutableError
} = require('../errors');

class ExpressionAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const iterator = this.sourceGraph.traverse(codeModule);

    iterator.iterate((node) => {
      this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'assignment':
        this.checkAssignment(node);
        break;
      default:
    }
  }

  checkAssignment (node) {
    const left = this.sourceGraph.relationFromNode(node, 'left')[0];
    const declNode = this.sourceGraph.relationFromNode(left, 'binding')[0];

    if (declNode && declNode.attributes.type === 'immutable_declaration') {
      throw new ReassignImmutableError(`Cannot reassign value to const \`${declNode.attributes.identifier}\``);
    }
  }
}

module.exports = ExpressionAnalyzer;
