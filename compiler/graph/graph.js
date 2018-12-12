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

  // this is a directed graph
  addEdge (sourceNode, targetNode, label, weight = 0) {
    if (sourceNode && targetNode) {
      const sourceEdge = new Edge(sourceNode, targetNode, label, weight);

      this.adjacencyList[sourceNode.id].edges.push(sourceEdge);
    }

    return null;
  }

  hasNode (id) {
    return this.nodes[id] !== undefined;
  }

  treeFromNode (node) {
    const adjList = this.adjacencyList[node.id];
    let t = node.attributes;
    adjList.edges.forEach((e) => {
      if (!t[e.label]) {
        t[e.label] = [];
      }

      t[e.label].push(this.treeFromNode(e.target));
    });

    return t;
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
