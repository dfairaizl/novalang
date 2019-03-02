const {
  MissingTypeAnnotationError,
  TypeMismatchError
} = require('../errors');

class TypeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const exprs = this.sourceGraph.outgoing(codeModule);

    exprs.forEach((n) => {
      const iterator = this.sourceGraph.traverse({ order: 'postorder' });

      console.log(n);
      // run analyze to check for static type declarations first
      iterator.iterate(n, (node) => {
        console.log('---', node.attributes);
        this.analyzeNode(node);
      });
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      // case 'immutable_declaration':
      //   this.inferType(node);
      //   break;
      // case 'mutable_declaration':
      //   this.checkType(node);
      //   break;
      case 'number_literal':
        this.associateType(node);
        break;
      // case 'variable_reference':
      //   this.inferVariableType(node);
      //   break;
      default:
    }
  }

  inferVariableType (node) {
    console.log(node.attributes);
    const declNode = this.sourceGraph.relationFromNode(node, 'binding')[0];
    console.log(declNode);
    const declType = this.sourceGraph.relationFromNode(declNode, 'type')[0];
    console.log('variable type', declType);

    const typeNode = this.buildType(declType.attributes.kind);
    this.sourceGraph.addEdge(node, typeNode, 'type');
  }

  inferType (node) {
    const annotation = node.attributes.kind;
    const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];

    if (expr) {
      const exprType = this.sourceGraph.relationFromNode(expr, 'type')[0];
      // check and reconcile with this node's annotation if it has one
      if (annotation && annotation !== exprType.attributes.kind) {
        // allow cast?

        throw new TypeMismatchError(`Cannot convert ${expr.attributes.kind} to ${annotation}`);
      }

      const typeNode = this.buildType(exprType.attributes.kind);
      this.sourceGraph.addEdge(node, typeNode, 'type');
    }
  }

  checkType (node) {
    let typeNode = null;
    const annotation = node.attributes.kind;
    const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];

    // no expression to infer in lets requires an explicit annotation
    if (!expr && !annotation) {
      throw new MissingTypeAnnotationError(`Declaration of variable \`${node.attributes.identifier}\` requires an explicit type`);
    }

    if (expr && expr.attributes.kind) {
      // check and reconcile with this node's annotation if it has one
      if (annotation && annotation !== expr.attributes.kind) {
        // allow cast?

        throw new TypeMismatchError(`Cannot convert ${expr.attributes.kind} to ${annotation}`);
      }

      typeNode = this.buildType(expr.attributes.kind);
    } else {
      typeNode = this.buildType(node.attributes.kind);
    }

    this.sourceGraph.addEdge(node, typeNode, 'type');
  }

  associateType (node) {
    const typeNode = this.buildType(node.attributes.kind);
    this.sourceGraph.addEdge(node, typeNode, 'type');
  }

  buildType (typeClass) {
    const types = this.sourceGraph.search('type');
    const typeNode = types.find((n) => {
      return n.attributes.kind === typeClass;
    });

    if (!typeNode) {
      const buildType = this.sourceGraph.addNode({ type: 'type', kind: typeClass });
      return buildType;
    }

    return typeNode;
  }
}

module.exports = TypeAnalyzer;
