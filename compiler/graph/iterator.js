class Iterator {
  constructor (graph, options) {
    this.graph = graph;
    this.head = options.startNode || null;
    this.traversalDepth = options.depth || Infinity;
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
}

module.exports = Iterator;
