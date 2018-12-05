class Node {
  constructor (id, attributes) {
    this.id = id;
    this.attributes = attributes;

    this.edges = [];
  }

  addEdge (edge) {
    this.edges.push(edge);
  }

  adjacents () {
    return this.edges.filter((edge) => {
      return edge.target.id !== this.id;
    });
  }
}

module.exports = Node;
