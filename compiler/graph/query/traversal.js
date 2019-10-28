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

  direction (options) {
    this.degree = options.degree;
    this.edgeLabel = options.label;
  }

  filter (criteria) {
    this.filters = criteria;
  }

  // Modified BFS collecting all paths
  run (graph, q) {
    while (q.length > 0) {
      const path = q.shift();
      const endNode = path.last();

      if (path.currentDepth > this.options.maxDepth) {
        continue;
      }

      const neighborsList = graph.adjacencyList[endNode.id].edges;
      neighborsList.forEach((edge) => {
        const neighborNode = this.nextMatchingEdge(edge);

        if (!neighborNode) {
          return;
        }

        if (!path.contains(neighborNode)) {
          const newPath = path.clone();
          newPath.append(neighborNode);

          if (this.isDestination(neighborNode)) {
            this.matchedPaths.push(newPath);
            this.matchedNodes[neighborNode.id] = neighborNode;

            return;
          }

          q.unshift(newPath);
        }
      });

      path.currentDepth++;
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

  nextMatchingEdge (edge) {
    if (this.edgeLabel && this.edgeLabel !== edge.label) {
      return null;
    }

    return this.degree === 'out' ? edge.target : edge.source;
  }
}

module.exports = Traversal;
