const BaseNode = require('./base');

class FunctionNode extends BaseNode {
  constructor (funcName, args, bodyExpressions) {
    super();

    this.name = funcName;
    this.args = args;

    this.body = bodyExpressions; // is an array of expression statements
  }
}

module.exports = FunctionNode;
