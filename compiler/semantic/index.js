const ExpressionAnalyzer = require('./analyzers/expression');
const ModuleAnalyzer = require('./analyzers/modules');
const ScopeAnalyzer = require('./analyzers/scope');
const TypeAnalyzer = require('./analyzers/types');

class SemanticAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;

    this.analyzers = [
      new ModuleAnalyzer(sourceGraph),
      new ScopeAnalyzer(sourceGraph),
      new ExpressionAnalyzer(sourceGraph),
      // new TypeAnalyzer(sourceGraph)
    ];
  }

  analyze () {
    this.analyzers.forEach(a => a.analyze());
  }
}

module.exports = SemanticAnalyzer;
