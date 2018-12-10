const BaseNode = require('./base');

class VariableNode extends BaseNode {
  constructor (mutable, varName, sourceExpr) {
    super();

    this.mutable = mutable;
    this.varName = varName;

    this.source = sourceExpr;
  }

  toString () {
    return `VariableNode(${this.varName})`;
  }
}

module.exports = VariableNode;