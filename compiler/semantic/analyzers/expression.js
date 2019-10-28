const {
  InvalidExportError,
  ReassignImmutableError
} = require('../errors');

class ExpressionAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const sourceQuery = this.sourceGraph.query();
    const sources = sourceQuery
      .match({ type: 'module', identifier: 'main_module' })
      .execute();

    if (sources.nodes()[0]) {
      this.codeModule = sources.nodes()[0];
      this.analyzeSources(this.codeModule);
    }
  }

  analyzeSources (sourceNode) {
    const sourceQuery = this.sourceGraph.query();
    const sources = sourceQuery
      .begin(sourceNode)
      .outgoing()
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    sources.nodes().forEach((source) => {
      this.analyzeNode(source);
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
    const leftQuery = this.sourceGraph.query();
    leftQuery.begin(node)
      .outgoing('left')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const left = leftQuery.nodes()[0];

    const bindingQuery = this.sourceGraph.query();
    bindingQuery.begin(left)
      .outgoing('binding')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const declNode = bindingQuery.nodes()[0];

    if (declNode && declNode.attributes.type === 'immutable_declaration') {
      throw new ReassignImmutableError(`Cannot reassign value to const \`${declNode.attributes.identifier}\``);
    }
  }

  checkExport (node) {
    const exportQuery = this.sourceGraph.query();
    exportQuery.begin(node)
      .outgoing('expression')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    const exportExpr = exportQuery.nodes()[0];

    if (exportExpr.attributes.type !== 'function' && exportExpr.attributes.type !== 'external_function') {
      throw new InvalidExportError('Only functions are allowed to be exported from modules.');
    }
  }
}

module.exports = ExpressionAnalyzer;
