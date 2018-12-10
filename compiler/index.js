const Parser = require('./parser');
const Graph = require('./graph/graph');

class Compiler {
  constructor (options) {
    this.options = options;
    this.sourceGraph = new Graph();
  }

  compile (source) {
    const parser = new Parser(source);

    let mod = parser.parse();
    const t = parser.sourceGraph.traverse(mod);
    t.iterate((n) => {
      console.log(n.attributes);
    });

    mod = parser.parse();
    const r = parser.sourceGraph.traverse(mod);
    r.iterate((n) => {
      console.log(n.attributes);
    });

    parser.sourceGraph.debug();
  }
}

module.exports = Compiler;
