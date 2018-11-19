const BaseNode = require('./base');

class NumberNode extends BaseNode {
  constructor (value) {
    super();

    this.value = value;
  }
}

module.exports = NumberNode;
