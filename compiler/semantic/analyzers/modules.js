const STANDARD_LIBRARY_MODULES = ['io'];

class ModuleAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');
    console.log(codeModule);
    const iterator = this.sourceGraph.traverse(codeModule);

    iterator.iterate(codeModule, (node) => {
      console.log('node', node);
      // this.analyzeNode(node);
    });
  }

  analyzeNode (node) {
    console.log('mod', node.attributes.type);
    switch (node.attributes.type) {
      case 'require_statement':
        this.checkRequire(node);
        break;
      default:
    }
  }

  checkRequire (node) {
    const externalMod = this.sourceGraph.relationFromNode(node, 'module');

    const mod = this.resolveModule(externalMod[0]);
  }

  resolveModule (node) {
    // is this module part of the standard library?
    const name = node.attributes.value;
    console.log('name', name);
    if (STANDARD_LIBRARY_MODULES.includes(name)) {
      console.log('importing stdlib', name);
    }

    // now we need to go looking for a module with this name
    // that is already assumed to have been parsed
    // then we can run our checks
  }
}

module.exports = ModuleAnalyzer;
