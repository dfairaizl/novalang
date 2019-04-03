const {
  InvalidExportError,
  ReassignImmutableError
} = require('../errors');

class ExpressionAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const iterator = this.sourceGraph.traverse();

    iterator.iterate(codeModule, (node) => {
      this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'assignment':
        this.checkAssignment(node);
        break;
      case 'export_statement':
        this.checkExport(node);
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

  checkExport (node) {
    const exportExpr = this.sourceGraph.relationFromNode(node, 'expression')[0];
    if (exportExpr.attributes.type !== 'function' && exportExpr.attributes.type !== 'external_function') {
      throw new InvalidExportError('Only functions are allowed to be exported from modules.');
    }
  }
}

module.exports = ExpressionAnalyzer;
