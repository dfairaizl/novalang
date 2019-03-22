const {
  ImportNotFoundError,
  InvalidExportError,
  ModuleNotFound
} = require('../errors');

class ModuleAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.name === 'main_module');
    const iterator = this.sourceGraph.traverse(codeModule);

    iterator.iterate(codeModule, (node) => {
      this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'import_statement':
        this.analyzeImports(node);
        break;
      case 'export_statement':
        this.analyzeExport(node);
        break;
    }
  }

  analyzeImports (node) {
    const module = this.resolveModule(node);
    const imports = this.sourceGraph.relationFromNode(node, 'import');

    const exports = this.sourceGraph.outgoing(module).filter((n) => n.attributes.type === 'export_statement');
    const exported = exports.map((n) => this.sourceGraph.relationFromNode(n, 'expression')[0]);

    // do the imports match function from the module?
    imports.forEach((importNode) => {
      const matchedNode = exported.find((n) => n.attributes.name === importNode.attributes.identifier);
      if (matchedNode) {
        this.sourceGraph.addEdge(importNode, matchedNode, 'binding');
        this.sourceGraph.addEdge(matchedNode, importNode, 'reference');
      } else {
        throw new ImportNotFoundError(`Import \`${importNode.attributes.identifier}\` was not found in module \`${module.attributes.name}\``);
      }
    });
  }

  analyzeExport (node) {
    const exportExpr = this.sourceGraph.relationFromNode(node, 'expression')[0];

    if (exportExpr.attributes.type !== 'function') {
      throw new InvalidExportError(`Only functions are allowed to be exported from modules`);
    }
  }

  resolveModule (node) {
    const name = node.attributes.name;
    const modules = this.sourceGraph.search('module');

    const resolvedMod = modules.find((n) => n.attributes.name === name);

    if (!resolvedMod) {
      throw new ModuleNotFound(`Module \`${node.attributes.name}\` not found`);
    }

    return resolvedMod;
  }
}

module.exports = ModuleAnalyzer;
