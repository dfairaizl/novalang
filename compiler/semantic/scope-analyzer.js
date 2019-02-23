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
        this.checkUses(node);
        break;
      case 'variable_reference':
        this.checkReference(node);
        break;
      default:
    }
  }

  checkUses (node) {
    // from this node, DFS search related nodes to find variable_references
    const parent = this.sourceGraph.incoming(node);

    const iterator = this.sourceGraph.traverse();
    iterator.iterate(parent[0], (n) => {
      if (this.checkBinding(node, n)) {
        // create binding reference edge
        this.sourceGraph.addEdge(n, node, 'binding');
        this.sourceGraph.addEdge(node, n, 'reference');
      }
    });

    const refs = this.sourceGraph.relationFromNode(node, 'reference');
    if (refs.length === 0) {
      console.info(`WARNING: Variable declaration \`${node.attributes.identifier}\` has not been used`);
    }
  }

  checkBinding (declNode, refNode) {
    if (refNode.attributes.type === 'variable_reference') {
      if (refNode.attributes.identifier === declNode.attributes.identifier) {
        return true;
      }
    }

    return false;
  }

  checkReference (node) {
    const bindingNode = this.sourceGraph.relationFromNode(node, 'binding');

    if (bindingNode.length === 0) {
      throw new Error(`Use of undeclared variable ${node.attributes.identifier}`);
    }
  }
}

module.exports = ScopeAnalyzer;
