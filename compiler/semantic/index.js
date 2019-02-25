const ScopeAnalyzer = require('./analyzers/scope');
const SyntaxAnalyzer = require('./analyzers/syntax');

class SemanticAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;

    this.analyzers = [
      new ScopeAnalyzer(sourceGraph),
      new SyntaxAnalyzer(sourceGraph)
    ];
  }

  analyze () {
    this.analyzers.forEach(a => a.analyze());
  }
}

module.exports = SemanticAnalyzer;
