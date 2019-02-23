class Node {
  constructor (id, attributes) {
    this.id = id;
    this.attributes = attributes;
  }

  toString () {
    return `${this.id}`;
  }
}

module.exports = Node;
