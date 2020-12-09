const { Query } = require('../../graph');
const {
  InvalidExportError,
  ReassignImmutableError
} = require('../errors');

class ExpressionAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const sourceQuery = new Query(this.sourceGraph);
    const result = sourceQuery
      .match({ type: 'module', identifier: 'main_module' }, { name: 'sources' })
      .returns('sources');

    this.codeModule = result.sources[0];
    this.analyzeSources(this.codeModule);
  }

  analyzeSources (sourceNode) {
    const sourceQuery = new Query(this.sourceGraph);
    const result = sourceQuery
      .find(sourceNode)
      .out(null, { name: 'sources'})
      .returns('sources')

    result.sources.forEach((source) => {
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
    const leftQuery = new Query(this.sourceGraph);
    const result = leftQuery.find(node)
      .out('left')
      .out('binding', { name: "binding" })
      .returns('binding');

    const declNode = result.binding[0];

    if (declNode && declNode.attributes.type === 'immutable_declaration') {
      throw new ReassignImmutableError(`Cannot reassign value to const \`${declNode.attributes.identifier}\``);
    }
  }

  checkExport (node) {
    const exportQuery = new Query(this.sourceGraph);
    const result = exportQuery.find(node)
      .out('expression', { name: 'expression' })
      .returns('expression');

    const exportExpr = result.expression[0];

    if (exportExpr.attributes.type !== 'function' && exportExpr.attributes.type !== 'external_function') {
      throw new InvalidExportError('Only functions are allowed to be exported from modules.');
    }
  }
}

module.exports = ExpressionAnalyzer;
