const {
  ImportNotFoundError,
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
      default:
    }
  }

  analyzeImports (node) {
    const module = this.resolveModule(node);
    const exported = this.sourceGraph.outgoing(module);
    const imports = this.sourceGraph.relationFromNode(node, 'import');

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