const Graph = require('../graph/graph');

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
    debugger;
    // console.log('!!!', node);
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
    console.log('checking use of', node.attributes);
    const edge = this.sourceGraph.edges.find(e => e.target.id === node.id);
    const parent = edge.source;

    const iterator = this.sourceGraph.traverse();
    iterator.iterate(parent, (n) => {
      if (this.checkBinding(node, n)) {
        // create binding reference edge
        this.sourceGraph.addEdge(node, n, 'declaration');
        // this.sourceGraph.addEdge(n, node, 'binding');
      }
    });

    const bindingNode = this.sourceGraph.relationFromNode(node, 'declaration');
    console.log(bindingNode);
    if (bindingNode.length > 0) {
      return true;
    }

    // found no node to bind this reference to
    // throw new Error(`Use of unbound variable ${node.attributes.identifier} `);
  }

  checkBinding (declNode, refNode) {
    console.log(declNode.attributes, refNode.attributes);
    if (refNode.attributes.type === 'variable_reference') {
      // console.log(declNode, refNode);
      if (refNode.attributes.identifier === declNode.attributes.identifier) {
        return true;
      }
    }

    return false;
  }

  checkReference (node) {
    const bindingNode = this.sourceGraph.relationFromNode(node, 'declaration');

    if (bindingNode.length > 0) {
      return true;
    }

    // found no declaration to match the reference
    // throw new Error(`Use of undeclared variable ${node.attributes} `);
  }

  // scopeForNode (node) {
  //   const scope = [];
  //   // baisc algorithm
  //   // 1. from current node get the adjacency list
  //
  //   const edge = this.sourceGraph.edges.find(e => e.target.id === node.id);
  //
  //   // 2. find the source of this node (node's parent)
  //   const parent = edge.source;
  //
  //   // 3. Iterate over children excluding `node`
  //   const iterator = this.sourceGraph.traverse();
  //   iterator.forEach(parent, (n) => {
  //     if (n.id !== node.id) {
  //       scope.push(n);
  //     }
  //   });
  //
  //   return scope;
  // }
}

module.exports = ScopeAnalyzer;
