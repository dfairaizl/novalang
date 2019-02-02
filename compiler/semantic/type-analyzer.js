class BaseType {
  constructor (kind, types = []) {
    this.kind = kind;
    this.types = types;
  }
}

class NumberType extends BaseType {}
class BoolType extends BaseType {}
class FunctionType extends BaseType {}

class VariableType extends BaseType {}

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

    console.log('type analysis', require('util').inspect(this.sourceGraph.treeFromNode(codeModule), { depth: null }));
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        return this.typeGenVar(node);
      case 'number_literal':
        return this.typeGenNumber(node);
      case 'function':
        return this.typeGenFunction(node);
      default:
        console.log('Unknown expression', node.attributes.type);
    }
  }

  typeGenVar (node) {
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression')[0];
    let typeVal = this.analyzeNode(exprNode);

    // check against declared annotation if any
    if (node.attributes.kind) {
      // unify the types and update typeVal if constraints are solvable
      const annotatedType = this.typeForAnnotation(node.attributes.kind);
      this.unify(typeVal, annotatedType);
    }

    // this node has the inferred type of its expression value
    node.attributes.kind = typeVal.kind;
  }

  typeGenFunction (node) {
    const types = [];
    const newNonGeneric = this.nonGeneric.slice();

    const args = this.sourceGraph.relationFromNode(node, 'arguments');
    args.forEach((arg) => {
      console.log('arg', arg.attributes);
      const kind = arg.attributes.kind;
      let type = null;

      if (kind) {
        type = this.typeForAnnotation(kind);
      } else {
        type = new VariableType();
        newNonGeneric.push(type);
      }

      this.env[arg.attributes.name] = type;
      types.push(type);
    });

    const value = this.sourceGraph.relationFromNode(node, 'body')[0];
    const resultType = this.analyzeNode(value);
    types.push(resultType);

    // check if function is annotated

    const funcType = new FunctionType('function', types);
    this.env[node.attributes.name] = funcType;
    // node.attributes.kind = result

    console.log('!!!', funcType);

    return funcType;
  }

  typeGenNumber (node) {
    return new NumberType(node.attributes.kind);
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
