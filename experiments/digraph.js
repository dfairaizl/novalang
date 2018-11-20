class Node {
  constructor (name, type) {
    this.name = name;
    this.type = type;
    this.inEdge = null;
    this.outEdges = [];

    // meta
    this.visited = false;
  }

  addIncoming (node) {
    this.inEdge = node;
  }

  addOutgoing (node) {
    this.outEdges.push(node);
    node.addIncoming(this);
  }
}

class DirectedGraph {
  traverse (node, depth = 1, maxDepth = 1) {
    let collectedNodes = new QueryResult();
    if (!node || node.visited) {
      return collectedNodes;
    }

    node.visited = true;
    collectedNodes.addResult(node);

    if (depth <= maxDepth) {
      node.outEdges.forEach((n) => {
        collectedNodes.combine(this.traverse(n, depth + 1, maxDepth));
      });
    }

    // go up
    return collectedNodes.combine(this.traverse(node.inEdge, depth, maxDepth));
  }
}

class QueryResult {
  constructor () {
    this.results = [];
  }

  addResult (r) {
    this.results.push(r);
  }

  combine (set) {
    set.results.forEach((r) => this.results.push(r));
    return this;
  }
}

module.exports = {
  DirectedGraph,
  Node,
  QueryResult
};
