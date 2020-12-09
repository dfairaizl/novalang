const { v4: uuidv4 } = require("uuid");

const Edge = require("./edge");
const Node = require("./node");

class AdjacencyList {
  constructor(node) {
    this.node = node;
    this.edges = [];
  }
}

class Graph {
  constructor() {
    this.adjacencyList = {};
  }

  get nodes() {
    return Object.values(this.adjacencyList).map((a) => a.node);
  }

  get edges() {
    const edges = [];

    Object.values(this.adjacencyList).forEach((list) => {
      list.edges.forEach((e) => {
        edges.push(e);
      });
    });

    return edges;
  }

  addNode(attributes = {}, id) {
    const nodeId = id || uuidv4();

    if (!this.adjacencyList[nodeId]) {
      const node = new Node(nodeId, attributes);
      this.adjacencyList[nodeId] = new AdjacencyList(node);
    }

    return this.adjacencyList[nodeId].node;
  }

  addEdge(sourceNode, targetNode, label, weight = 0) {
    if (sourceNode && targetNode) {
      const sourceEdge = new Edge(sourceNode, targetNode, label, weight);

      this.adjacencyList[sourceNode.id].edges.push(sourceEdge);
    }

    return null;
  }

  outgoing(fromNode, label) {
    const edges = this.adjacencyList[fromNode.id].edges;

    if (label) {
      return edges.filter((e) => e.label === label).map((e) => e.target);
    }

    return edges.map((e) => e.target);
  }

  outgoingEdges(fromNode, label) {
    const edges = this.adjacencyList[fromNode.id].edges;

    if (label) {
      return edges.filter((e) => e.label === label);
    }

    return edges;
  }

  incoming(toNode, label) {
    const edges = this.edges.filter((e) => e.target.id === toNode.id);

    if (label) {
      return edges.filter((e) => e.label === label).map((e) => e.source);
    }

    return edges.map((e) => e.source);
  }

  incomingEdges(toNode, label) {
    const edges = this.edges.filter((e) => e.target.id === toNode.id);

    if (label) {
      return edges.filter((e) => e.label === label);
    }

    return edges;
  }

  merge(graph) {
    Object.entries(graph.adjacencyList).forEach(([key, val]) => {
      this.adjacencyList[key] = val;
    });
  }

  treeFromNode(node, visitCache) {
    if (!node) {
      node = this.nodes.find((n) => n.attributes.type === "module");
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

  /* istanbul ignore next */
  debug() {
    // nodes
    const nodes = this.nodes.map((node) => {
      return {
        id: node.id,
        label: node.attributes.type,
      };
    });

    console.log("NODES");
    console.log(JSON.stringify(nodes));

    // edges
    const edges = [];
    this.edges.forEach((e) => {
      edges.push({
        from: e.source.id,
        to: e.target.id,
        label: e.label,
        arrows: "to",
      });
    });

    console.log("EDGES");
    console.log(JSON.stringify(edges));
  }
}

module.exports = Graph;
