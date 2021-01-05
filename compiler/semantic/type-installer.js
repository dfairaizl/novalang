const { Query } = require('../graph');

class TypeInstaller {
  constructor(sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  install() {
    this.installPrimitives();
  }

  installPrimitives() {
    const builtIns = {
      'Int': 'i32',
      'Boolean': 'i1',
      'Void': 'void'
    }

    Object.entries(builtIns).forEach(([dest, source]) => {
      this.sourceGraph.addNode({
        dataType: 'primitive',
        type: 'type_declaration',
        sourceType: source,
        destinationType: dest
      });
    })
  }
}

module.exports = TypeInstaller;
