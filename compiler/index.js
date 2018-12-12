const Parser = require('./parser');
const Graph = require('./graph/graph');

class Compiler {
  constructor (options) {
    this.options = options;
    this.sourceGraph = new Graph();
  }

  compile (source) {
    const parser = new Parser(source);

    let codeModule = parser.parse();

    console.log(parser.sourceGraph.treeFromNode(codeModule));

    // parser.sourceGraph.debug();
  }
}

module.exports = Compiler;
