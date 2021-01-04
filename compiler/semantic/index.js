const Binder = require('./bindings');
const TypeInstaller = require('./type-installer');

const ExpressionAnalyzer = require('./analyzers/expression');
const TypeAnalyzer = require('./analyzers/types');

class SemanticAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;

    // Execute the binder to construct the source graph relations
    // of variables and declarations etc...
    const binder = new Binder(sourceGraph);
    binder.bindModules();

    // Install the built-in types into the system
    const typeInstaller = new TypeInstaller(sourceGraph);
    typeInstaller.install();

    // analyze the the final source graph
    this.analyzers = [
      new ExpressionAnalyzer(sourceGraph),
      new TypeAnalyzer(sourceGraph)
    ];
  }

  analyze () {
    this.analyzers.forEach(a => a.analyze());
  }
}

module.exports = SemanticAnalyzer;
