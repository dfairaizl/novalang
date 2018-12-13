const Parser = require('./parser');
const Graph = require('./graph/graph');

class Compiler {
  constructor (options) {
    this.options = {
      debugGraph: false,
      ...options
    };

    this.sourceGraph = new Graph();
  }

  compile (source) {
    const parser = new Parser(source);

    parser.parse(); // discard result for now

    if (this.options.debugGraph) {
      parser.sourceGraph.debug();
    }
  }
}

module.exports = Compiler;
