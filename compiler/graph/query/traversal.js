class Traversal {
  constructor () {
    this.matchedNodes = {};
    this.matchedPaths = [];
  }

  start (node) {
    this.startNode = node;
  }

  direction (d) {
    this.degree = d;
  }

  filter (criteria) {
    this.filters = criteria;
  }

  // Modified BFS collecting all paths
  run (graph, q) {
    while (q.length > 0) {
      const path = q.shift();
      const endNode = path[path.length - 1];

      if (this.isDestination(endNode)) {
        this.matchedPaths.unshift(path);
        this.matchedNodes[endNode.id] = endNode;

        continue;
      }

      const neighborsList = graph.adjacencyList[endNode.id].edges;
      neighborsList.forEach((edge) => {
        const target = edge.target;

        if (!path.find((n) => n.id === target.id)) {
          const newPath = path.slice();
          newPath.push(target);
          q.unshift(newPath);
        }
      });

      this.depth++;
    }
  }

  isDestination (node) {
    return Object.entries(this.filters).every(([key, val]) => {
      return node.attributes[key] === val;
    });
  }

  findNodes (graph) {
    const nodes = graph.nodes.filter((node) => {
      return this.isDestination(node);
    });

    this.matchedNodes = nodes;
    this.matchedPaths = nodes.map((node) => [node]);
  }
}

module.exports = Traversal;
