class ModuleAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    const iterator = this.sourceGraph.traverse(codeModule);

    iterator.iterate(codeModule, (node) => {
      this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'immutable_declaration':
        this.checkImported(node);
        break;
      default:
    }
  }

  checkImported (node) {
    // is the expression for this declaration a require statement?
    const exprNode = this.sourceGraph.relationFromNode(node, 'expression');

    if (exprNode[0].attributes.type === 'require_statement') {
      const moduleNode = this.importModule(exprNode[0]);

      this.sourceGraph.outgoing(moduleNode).forEach((n) => {
        if (n.attributes.name === node.attributes.identifier) {
          this.sourceGraph.addEdge(node, n, 'binding');
          this.sourceGraph.addEdge(n, node, 'reference');
        }
      });
    }
  }

  importModule (node) {
    const externalMod = this.sourceGraph.relationFromNode(node, 'module');

    return this.resolveModule(externalMod[0]);
  }

  resolveModule (node) {
    const name = node.attributes.value;
    const modules = this.sourceGraph.search('module');

    const resolvedMod = modules.find((n) => n.attributes.name === name);

    if (!resolvedMod) {
      throw new Error('Unknown module');
    }

    return resolvedMod;
  }
}

module.exports = ModuleAnalyzer;
