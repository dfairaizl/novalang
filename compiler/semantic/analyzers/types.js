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
    const iterator = this.sourceGraph.traverse(codeModule);

    iterator.iterate((node) => {
      this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        this.inferType(node);
        break;
      case 'function':
        this.inferFunctionType(node);
        break;
      case 'mutable_declaration':
        this.checkType(node);
        break;
      default:
    }
  }

  inferType (node) {
    const annotation = node.attributes.kind;
    const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];

    if (expr.attributes.kind) {
      // check and reconcile with this node's annotation if it has one
      if (annotation && annotation !== expr.attributes.kind) {
        // allow cast?

        throw new TypeMismatchError(`Cannot convert ${expr.attributes.kind} to ${annotation}`);
      }

      const typeNode = this.buildType(expr.attributes.kind);
      this.sourceGraph.addEdge(node, typeNode, 'type');
    }
  }

  inferFunctionType (node) {
    const bodyNode = this.sourceGraph.relationFromNode(node, 'body')[0];
    // do we have a return type?

    const ret = this.sourceGraph.relationFromNode(bodyNode, 'return_statement')[0];
    if (!ret) {
      const typeNode = this.buildType('void');
      this.sourceGraph.addEdge(node, typeNode, 'type');
    } else {

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

  buildType (typeClass) {
    return this.sourceGraph.addNode({ type: 'type', kind: typeClass });
  }
}

module.exports = TypeAnalyzer;
