const uuid = require('uuid/v4');

const Node = require('./node');
const Edge = require('./edge');
// const dfs = require('./utils/dfs');

class Graph {
  constructor () {
    this.nodes = {};
    this.edges = [];
  }

  addNode (attributes = {}, id) {
    const nodeId = id || uuid();

    if (!this.hasNode(nodeId)) {
      this.nodes[nodeId] = new Node(nodeId, attributes);
    }

    return this.nodes[nodeId];
  }

  addEdge (sourceNode, targetNode, weight = 0, attributes = {}) {
    if (weight instanceof Object) {
      attributes = weight;
      weight = 0;
    }

    if (sourceNode && targetNode) {
      const edge = new Edge(sourceNode, targetNode, weight, attributes);

      sourceNode.addEdge(edge);
      targetNode.addEdge(edge);

      this.edges.push(edge);

      return edge;
    }

    return null;
  }

  hasNode (id) {
    return this.nodes[id] !== undefined;
  }

  traverse (startNode = null, depth) {
    return new Iterator(this, {
      startNode,
      depth
    });
  }
}

class Iterator {
  constructor (graph, options) {
    this.graph = graph;
    this.head = options.startNode || null;
    this.traversalDepth = options.depth || Infinity;
    this.visitCache = {};
  }

  forEach (callback) {
    if (!this.head) {
      this.head = Object.values(this.graph.nodes)[0]; // pick an arbitrary node in the graph to start at
      callback(this.head); // and visit it
    }

    const iterator = (node, depth, maxDepth) => {
      console.log(depth, maxDepth);
      this.visitCache[node.id] = true;

      node.edges.forEach((e) => {
        const target = e.target;
        if (target.id !== this.head.id) {
          if (!this.visitCache[target.id] && depth <= maxDepth) {
            callback(target);
            iterator(target, depth + 1, maxDepth);
          }
        }
      });
    };

    iterator(this.head, 1, this.traversalDepth);
  }
}

module.exports = Graph;
