const BaseNode = require('./base');

class InvocationNode extends BaseNode {
  constructor (funcName, args) {
    super();

    this.name = funcName;
    this.args = args;
  }
}

module.exports = InvocationNode;
