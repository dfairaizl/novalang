class Iterator {
  constructor (graph, options) {
    this.graph = graph;
    this.visitCache = {};
  }

  dfs (source, callback) {
    this.visitCache[source.id] = true;
    callback(source);

    // get the adjacency list
    const neighborsList = this.graph.adjacencyList[source.id];

    // get all the nodes in this adj list
    neighborsList.edges.forEach((edge) => {
      if (!this.visitCache[edge.target.id]) {
        this.dfs(edge.target, callback);
      }
    });
  }

  iterate (entryNode, callback) {
    // no entry node, traverse all components in the graph
    if (typeof entryNode === 'function') {
      callback = entryNode;
      this.graph.nodes.forEach((node) => {
        if (this.visitCache[node.id] !== true) {
          this.dfs(node, callback);
        }
      });
    } else {
      this.dfs(entryNode, callback);
    }
  }

  forEach (entryNode, callback) {
    let startNode = null;

    if (typeof entryNode === 'function') {
      callback = entryNode;
      startNode = this.graph.nodes[0];
    } else {
      startNode = entryNode;
    }

    let stack = [startNode];

    while (stack.length > 0) {
      let node = stack.pop();

      // visit the node first
      const ret = callback(node);
      if (ret) {
        this.graph.nodes[node.id] = ret;
      }

      this.visitCache[node.id] = true;

      // get the adjacency list
      const neighborsList = this.graph.adjacencyList[node.id];
      const adjacentNodes = neighborsList.edges.map((edge) => edge.target);

      stack = stack.concat(adjacentNodes.reverse());
    }
  }
}

module.exports = Iterator;
