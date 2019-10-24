const Path = require('./path');

class Traversal {
  constructor () {
    this.matchedNodes = {};
    this.matchedPaths = [];

    this.options = {
      maxDepth: 5
    };
  }

  configure (options) {
    this.options = { ...this.options, ...options };
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
      const endNode = path.last();

      if (endNode !== path.rootNode && this.isDestination(endNode)) {
        this.matchedPaths.unshift(path);
        this.matchedNodes[endNode.id] = endNode;

        continue;
      }

      if (path.path.length - 1 >= this.options.maxDepth) {
        continue;
      }

      const neighborsList = graph.adjacencyList[endNode.id].edges;
      neighborsList.forEach((edge) => {
        const target = edge.target;

        if (!path.contains(target)) {
          const newPath = path.clone();
          newPath.append(target);
          q.unshift(newPath);
        }
      });
    }
  }

  isDestination (node) {
    if (!this.filters) {
      return true;
    }

    return Object.entries(this.filters).every(([key, val]) => {
      return node.attributes[key] === val;
    });
  }

  findNodes (graph) {
    const nodes = graph.nodes.filter((node) => {
      return this.isDestination(node);
    });

    this.matchedNodes = nodes;
    this.matchedPaths = nodes.map((node) => new Path(node, this.options));
  }
}

module.exports = Traversal;
