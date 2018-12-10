const uuid = require('uuid/v4');

const Node = require('./node');
const Edge = require('./edge');

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
      sourceNode.addEdge(new Edge(sourceNode, targetNode, weight, attributes));
      targetNode.addEdge(new Edge(sourceNode, targetNode, weight, attributes));
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

  forEach (postOrder = false, callback) {
    const order = [];

    if (!this.head) {
      this.head = Object.values(this.graph.nodes)[0]; // pick an arbitrary node in the graph to start at
    }

    if (callback) callback(this.head); // visit the start node and mark it
    this.visitCache[this.head.id] = true;

    const iterator = (node, depth, maxDepth) => {
      const edges = postOrder ? node.inEdges() : node.outEdges();
      this.visitCache[node.id] = true;

      edges.forEach((e) => {
        const source = postOrder ? e.source : e.target;
        if (source.id !== this.head.id) {
          if (!this.visitCache[source.id] && depth <= maxDepth) {
            if (callback) callback(source);
            iterator(source, depth + 1, maxDepth);
          }
        }
      });

      if (!callback) {
        order.push(node);
      }
    };

    iterator(this.head, 1, this.traversalDepth);
    return order;
  }

  iterate (callback) {
    this.forEach(false, callback);
  }

  sorted () {
    return this.forEach(true);
  }
}

module.exports = Graph;
