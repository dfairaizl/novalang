class Node {
  constructor (id, attributes) {
    this.id = id;
    this.attributes = attributes;

    this.edges = [];
  }

  addEdge (edge) {
    this.edges.push(edge);
  }

  outEdges () {
    return this.edges.filter((edge) => {
      return edge.target.id !== this.id;
    });
  }

  inEdges () {
    return this.edges.filter((edge) => {
      return edge.source.id !== this.id;
    });
  }
}

module.exports = Node;
