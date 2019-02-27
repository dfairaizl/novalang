const ScopeAnalyzer = require('./analyzers/scope');
const ExpressionAnalyzer = require('./analyzers/expression');

class SemanticAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;

    this.analyzers = [
      new ScopeAnalyzer(sourceGraph),
      new ExpressionAnalyzer(sourceGraph)
    ];
  }

  analyze () {
    this.analyzers.forEach(a => a.analyze());
  }
}

module.exports = SemanticAnalyzer;
