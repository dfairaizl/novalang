const {
  ReassignImmutableError,
  UndeclaredVariableError
} = require('./errors');

class ScopeAnalyzer {
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
      case 'mutable_declaration':
        this.checkDeclarationUses(node);
        break;
      case 'function_argument':
        this.checkArgUses(node);
        break;
      case 'variable_reference':
        this.checkReference(node);
        break;
      case 'function':
        this.checkFunctionUses(node);
        break;
      case 'assignment':
        this.checkAssignment(node);
        break;
      default:
    }
  }

  checkDeclarationUses (node) {
    // from this node, DFS search related nodes to find variable_references
    const parent = this.sourceGraph.incoming(node);

    const iterator = this.sourceGraph.traverse();
    iterator.iterate(parent[0], (n) => {
      if (this.checkDeclarationBinding(node, n)) {
        this.sourceGraph.addEdge(n, node, 'binding');
        this.sourceGraph.addEdge(node, n, 'reference');
      }
    });

    const refs = this.sourceGraph.relationFromNode(node, 'reference');
    if (refs.length === 0) {
      console.info(`WARNING: Variable declaration \`${node.attributes.identifier}\` has not been used`);
    }
  }

  checkArgUses (node) {
    // from this node, DFS search related nodes to find variable_references
    const parent = this.sourceGraph.incoming(node);

    const iterator = this.sourceGraph.traverse();
    iterator.iterate(parent[0], (n) => {
      if (this.checkArgumentBinding(node, n)) {
        this.sourceGraph.addEdge(n, node, 'binding');
        this.sourceGraph.addEdge(node, n, 'reference');
      }
    });

    const refs = this.sourceGraph.relationFromNode(node, 'reference');
    if (refs.length === 0) {
      console.info(`WARNING: Function argument \`${node.attributes.identifier}\` has not been used`);
    }
  }

  checkFunctionUses (node) {
    // from this node, DFS search related nodes to find variable_references
    const parent = this.sourceGraph.incoming(node);

    const iterator = this.sourceGraph.traverse();
    iterator.iterate(parent[0], (n) => {
      if (this.checkFunctionBinding(node, n)) {
        this.sourceGraph.addEdge(n, node, 'function_binding');
        this.sourceGraph.addEdge(node, n, 'reference');
      }
    });

    const refs = this.sourceGraph.relationFromNode(node, 'reference');
    if (refs.length === 0) {
      console.info(`WARNING: Function \`${node.attributes.name}\` has not been used`);
    }
  }

  // This check does not completely fit here - is there a better place
  // in semantic analysis to keep checks like these?

  checkAssignment (node) {
    const left = this.sourceGraph.relationFromNode(node, 'left')[0];
    const declNode = this.sourceGraph.relationFromNode(left, 'binding')[0];

    if (declNode && declNode.attributes.type === 'immutable_declaration') {
      throw new ReassignImmutableError(`Cannot reassign value to const \`${declNode.attributes.identifier}\``);
    }
  }

  checkDeclarationBinding (declNode, refNode) {
    if (refNode.attributes.type === 'variable_reference') {
      if (refNode.attributes.identifier === declNode.attributes.identifier) {
        return true;
      }
    }

    return false;
  }

  checkArgumentBinding (argNode, refNode) {
    if (refNode.attributes.type === 'variable_reference') {
      if (refNode.attributes.identifier === argNode.attributes.identifier) {
        return true;
      }
    }

    return false;
  }

  checkFunctionBinding (argNode, refNode) {
    if (refNode.attributes.type === 'invocation') {
      if (refNode.attributes.identifier === argNode.attributes.identifier) {
        return true;
      }
    }

    return false;
  }

  checkReference (node) {
    const bindingNode = this.sourceGraph.relationFromNode(node, 'binding');

    if (bindingNode.length === 0) {
      throw new UndeclaredVariableError(`Use of undeclared variable \`${node.attributes.identifier}\``);
    }
  }
}

module.exports = ScopeAnalyzer;
