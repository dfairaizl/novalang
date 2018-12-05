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
      callback(this.head); // visit the start node and mark it
    }

    this.visitCache[this.head.id] = true;

    const iterator = (node, depth, maxDepth) => {
      this.visitCache[node.id] = true;

      node.adjacents().forEach((e) => {
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

  postOrder () {
    const order = [];

    if (!this.head) {
      return null;
    }

    this.visitCache[this.head.id] = true;

    const iterator = (node, depth, maxDepth) => {
      this.visitCache[node.id] = true;
      const flippedEdges = node.edges.map((e) => new Edge(e.target, e.source, e.weight, e.attributes));
      flippedEdges.forEach((e) => {
        const target = e.target;
        if (target.id !== this.head.id) {
          if (!this.visitCache[target.id] && depth <= maxDepth) {
            iterator(target, depth + 1, maxDepth);
          }
        }
      });

      order.push(node);
    };

    iterator(this.head, 1, this.traversalDepth);

    return order;
  }

  // forEachBFS (callback) {
  //   let queue = [];
  //   let distance = 0;
  //
  //   if (!this.head) {
  //     this.head = Object.values(this.graph.nodes)[0]; // pick an arbitrary node in the graph to start at
  //   }
  //
  //   queue.push(this.head);
  //
  //   // visit head first
  //   callback(this.head, distance);
  //   this.visitCache[this.head.id] = true;
  //
  //   while (queue.length > 0) {
  //     const node = queue.pop();
  //
  //     node.edges.forEach((e) => {
  //       const n = e.target;
  //
  //       if (!this.visitCache[n.id]) {
  //         this.visitCache[n.id] = true;
  //         queue = [n].concat(queue);
  //         callback(n, distance);
  //       }
  //     });
  //
  //     ++distance;
  //   }
  // }
}

module.exports = Graph;
