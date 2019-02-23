class TypeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const t = this.sourceGraph.traverse();
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');

    t.forEach(codeModule, (s) => { // dfs this expression
      const ty = this.analyzeNode(s);
      s.attributes.kind = ty;
      console.log(s.attributes.type);

      return s;
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        const r = this.typeGenVar(node);
        return r;
      case 'number_literal':
        return this.typeGenNumber(node);
      case 'string_literal':
        return this.typeGenString(node);
      case 'boolean_literal':
        return this.typeGenBool(node);
      case 'variable_reference':
        return this.typeGenVariable(node);
      case 'function':
        return this.typeGenFunction(node);
      case 'return_statement':
        return this.typeGenReturn(node);
      case 'bin_op':
        return this.typeGenBinOp(node);
      default:
        // console.log('Unknown expression', node.attributes.type);
    }
  }

  typeGenVar (node) {
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];
    const typeVal = this.analyzeNode(exprNode);

    // this node has the inferred type of its expression value
    return typeVal;
  }

  typeGenFunction (node) {
    const args = this.sourceGraph.relationFromNode(node, 'arguments');
    args.forEach((arg) => {
      console.log(arg.attributes);
      if (!arg.attributes.kind) {
        throw new Error(`Argument ${arg.attributes.identifier} in function ${node.attributes.name} must have a type`);
      }
    });

    const nodes = this.sourceGraph.relationFromNode(node, 'body');
    const typeCollection = nodes.map((n) => {
      return this.analyzeNode(n);
    });

    // check if function is annotated

    const retType = typeCollection[typeCollection.length - 1];
    node.attributes.kind = retType;
    return retType;
  }

  typeGenReturn (node) {
    const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];
    return this.analyzeNode(expr);
  }

  typeGenBinOp (node) {
    const leftExpr = this.sourceGraph.relationFromNode(node, 'left')[0];
    const rightExpr = this.sourceGraph.relationFromNode(node, 'right')[0];

    const lhs = this.analyzeNode(leftExpr);
    const rhs = this.analyzeNode(rightExpr);

    return rhs;
    // sicne we're in a binop, require the types on both sides be equal
    // if (lhs instanceof VariableType) {
    //   return rhs.kind;
    // } else {
    //   return lhs.kind;
    // }
  }

  typeGenVariable (node) {
    return node.identifier;
  }

  typeGenNumber (node) {
    return node.attributes.kind;
  }

  typeGenBool (node) {
    return node.attributes.kind;
  }

  typeGenString (node) {
    return node.attributes.kind;
  }
}

module.exports = TypeAnalyzer;
