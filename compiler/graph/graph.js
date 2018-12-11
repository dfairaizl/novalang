const uuid = require('uuid/v4');

const Edge = require('./edge');
const Iterator = require('./iterator');
const Node = require('./node');

class AdjacencyList {
  constructor (node) {
    this.node = node;
    this.edges = [];
  }
}

class Graph {
  constructor () {
    this.adjacencyList = {};
  }

  nodeFor (id) {
    const adjList = this.adjacencyList[id] || {};
    return adjList.node;
  }

  get nodes () {
    return Object.values(this.adjacencyList).map((a) => a.node);
  }

  get edges () {
    const edges = [];
    Object.values(this.adjacencyList).forEach((list) => {
      list.edges.forEach((e) => {
        edges.push(e);
      });
    });

    return edges;
  }

  addNode (attributes = {}, id) {
    const nodeId = id || uuid();

    if (!this.nodeFor(nodeId)) {
      const node = new Node(nodeId, attributes);
      this.adjacencyList[nodeId] = new AdjacencyList(node);
    }

    return this.adjacencyList[nodeId].node;
  }

  addEdge (sourceNode, targetNode, label, weight = 0) {
    if (sourceNode && targetNode) {
      const sourceEdge = new Edge(sourceNode, targetNode, label, weight);
      const targetEdge = new Edge(targetNode, sourceNode, label, weight);

      this.adjacencyList[sourceNode.id].edges.push(sourceEdge);
      this.adjacencyList[targetNode.id].edges.push(targetEdge);
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

  debug () {
    // nodes
    const nodes = this.nodes.map((node) => {
      return {
        id: node.id,
        label: node.attributes.type
      };
    });

    console.log('NODES');
    console.log(JSON.stringify(nodes));

    // edges
    const edges = [];
    this.edges.forEach((e) => {
      edges.push({ from: e.source.id, to: e.target.id });
    });

    console.log('EDGES');
    console.log(JSON.stringify(edges));
  }
}

module.exports = Graph;
