const Parser = require('./parser');
const Graph = require('./graph/graph');
const {
  FunctionNode
} = require('./graph/nodes');

class Compiler {
  constructor (options) {
    this.options = options;
    this.sourceGraph = new Graph();
  }

  compile (source) {
    const parser = new Parser(source);
    const sourceModule = this.sourceGraph.addNode({ type: 'module' });

    debugger;
    const expression = parser.parse();
    this.assembleGraphNode(sourceModule, expression);

    const t = this.sourceGraph.traverse();

    t.iterate((n) => {
      console.log(n.attributes);
    });
  }

  assembleGraphNode (sourceNode, expression) {
    const exprNode = this.sourceGraph.addNode(expression);

    if (expression instanceof FunctionNode) {
      const bodyExpr = this.assembleGraphNode(exprNode, expression.body);
      this.sourceGraph.addEdge(exprNode, bodyExpr);
    } else {
      return exprNode;
    }

    this.sourceGraph.addEdge(sourceNode, exprNode);
  }
}

module.exports = Compiler;
