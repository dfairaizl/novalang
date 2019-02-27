const ScopeAnalyzer = require('./analyzers/scope');
const ExpressionAnalyzer = require('./analyzers/expression');
const TypeAnalyzer = require('./analyzers/types');

class SemanticAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;

    this.analyzers = [
      new ScopeAnalyzer(sourceGraph),
      new ExpressionAnalyzer(sourceGraph),
      new TypeAnalyzer(sourceGraph)
    ];
  }

  analyze () {
    this.analyzers.forEach(a => a.analyze());
  }
}

module.exports = SemanticAnalyzer;
