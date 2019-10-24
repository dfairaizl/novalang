const uuid = require('uuid/v4');

class Path {
  constructor (rootNode, options) {
    this.path = [];
    this.id = uuid();

    if (rootNode) {
      this.rootNode = rootNode;
      this.path.push(rootNode);
    }

    this.options = options;
    this.currentDepth = 0;
  }

  last () {
    return this.path[this.path.length - 1];
  }

  contains (node) {
    return this.path.find((n) => n.id === node.id);
  }

  append (node) {
    this.path.push(node);
  }

  clone () {
    const p = new Path();

    p.id = this.id;
    p.options = { ...this.options }; // shallow copy
    p.currentDepth = this.currentDepth;
    p.path = this.path.slice();

    return p;
  }
}

module.exports = Path;
