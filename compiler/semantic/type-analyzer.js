class BaseType {
  constructor (kind, types = []) {
    this.kind = kind;
    this.types = types;
  }
}

class NumberType extends BaseType {}
class StringType extends BaseType {}
class BoolType extends BaseType {}
class FunctionType extends BaseType {}

let varPlaceHolderIds = 0;
class VariableType extends BaseType {
  constructor () {
    super('variable');

    this.placeholder = ++varPlaceHolderIds;
  }
}

class TypeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
    this.env = {};
    this.nonGeneric = [];
  }

  unify (type1, type2) {
    type1 = this.prune(type1);
    type2 = this.prune(type2);

    // other cases

    if (type1 instanceof BaseType && type2 instanceof BaseType) {
      if (type1.kind !== type2.kind || type1.types.length !== type2.types.length) {
        throw new Error('Type error: ' + type1.toString() + ' is not ' + type2.toString());
      }

      for (let i = 0; i < Math.min(type1.types.length, type2.types.length); i++) {
        this.unify(type1.types[i], type2.types[i]);
      }
    }
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');

    const adj = this.sourceGraph.adjacencyList[codeModule.id];
    adj.edges.forEach((e) => {
      const node = e.target;
      this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        return this.typeGenVar(node);
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
        console.log('Unknown expression', node.attributes.type);
    }
  }

  typeGenVar (node) {
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];
    let typeVal = this.analyzeNode(exprNode);

    // check against declared annotation if any
    // if (node.attributes.kind) {
    //   // unify the types and update typeVal if constraints are solvable
    //   const annotatedType = this.typeForAnnotation(node.attributes.kind);
    //   this.unify(typeVal, annotatedType);
    // }

    // this node has the inferred type of its expression value
    node.attributes.kind = typeVal.kind;
  }

  typeGenFunction (node) {
    // const types = [];
    // deal with types of args

    const nodes = this.sourceGraph.relationFromNode(node, 'body');
    const typeCollection = nodes.map((n) => {
      return this.analyzeNode(n);
    });

    // // check if function is annotated
    //
    // const funcType = new FunctionType('function', types);
    // this.env[node.attributes.name] = funcType;

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

    // sicne we're in a binop, require the types on both sides be equal
    if (lhs instanceof VariableType) {
      return rhs.kind;
    } else {
      return lhs.kind;
    }
  }

  typeGenVariable (node) {
    // check for annotation?

    return new VariableType();
  }

  typeGenNumber (node) {
    return new NumberType(node.attributes.kind);
  }

  typeGenBool (node) {
    return new BoolType(node.attributes.kind);
  }

  typeGenString (node) {
    return new StringType(node.attributes.kind);
  }

  // helpers

  prune (type) {
    // do the variable type check

    return type;
  }

  typeForAnnotation (kind) {
    switch (kind) {
      case 'int':
        return new NumberType(kind);
      case 'bool':
        return new BoolType();
      default:
        return null;
    }
  }
}

module.exports = TypeAnalyzer;
