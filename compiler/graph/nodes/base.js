const { traverse } = require('../utils/traverse');

class BaseNode {
  constructor () {
    this.visited = false;

    this.outEdges = [];
    this.inEdge = null;
  }

  addOutgoing (edge) {
    this.outEdges.push(edge);
    edge.addIncoming(this);
  }

  addIncoming (edge) {
    this.inEdge = edge;
  }

  scope (depth = 1, maxDepth = 1) {
    const query = traverse(this, depth, maxDepth);
    return query;
  }
}

module.exports = BaseNode;
