const uuid = require('uuid/v4');

const Edge = require('./edge');
const Iterator = require('./iterator');
const Node = require('./node');
const QueryBuilder = require('./query');

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

  nodeFor (id) {
    const adjList = this.adjacencyList[id] || {};
    return adjList.node;
  }

  addNode (attributes = {}, id) {
    const nodeId = id || uuid();

    if (!this.nodeFor(nodeId)) {
      const node = new Node(nodeId, attributes);
      this.adjacencyList[nodeId] = new AdjacencyList(node);
    }

    return this.adjacencyList[nodeId].node;
  }

  merge (graph) {
    Object.entries(graph.adjacencyList).forEach(([key, val]) => {
      this.adjacencyList[key] = val;
    });
  }

  // this is a directed graph
  addEdge (sourceNode, targetNode, label, weight = 0) {
    if (sourceNode && targetNode) {
      const sourceEdge = new Edge(sourceNode, targetNode, label, weight);

      this.adjacencyList[sourceNode.id].edges.push(sourceEdge);
    }

    return null;
  }

  outgoing (fromNode) {
    console.log(fromNode);
    return this.adjacencyList[fromNode.id].edges.map((n) => n.target);
  }

  incoming (toNode) {
    return this.edges.filter(e => e.target.id === toNode.id).map(e => e.source);
  }

  search (nodeAttrs) {
    const agg = [];

    this.nodes.forEach((n) => {
      if (n.attributes.type === nodeAttrs) {
        agg.push(n);
      }
    });

    return agg;
  }

  relationFromNode (node, label) {
    const adjList = this.adjacencyList[node.id];
    const n = adjList.edges.filter((e) => e.label === label);
    return n.map((n) => n.target);
  }

  // refactor this to use DFS
  treeFromNode (node, visitCache) {
    if (!node) {
      node = this.nodes.find((n) => n.attributes.type === 'module');
    }

    if (!visitCache) {
      visitCache = {};
    }

    const adjList = this.adjacencyList[node.id];
    let t = node.attributes;

    visitCache[node.id] = true;

    adjList.edges.forEach((e) => {
      if (!t[e.label]) {
        t[e.label] = [];
      }

      if (!visitCache[e.target.id]) {
        t[e.label].push(this.treeFromNode(e.target, visitCache));
      }
    });

    return t;
  }

  traverse (options) {
    return new Iterator(this, options);
  }

  query (options) {
    return new QueryBuilder(this, options);
  }

  /* istanbul ignore next */
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
      edges.push({
        from: e.source.id,
        to: e.target.id,
        label: e.label,
        arrows: 'to'
      });
    });

    console.log('EDGES');
    console.log(JSON.stringify(edges));
  }
}

module.exports = Graph;
