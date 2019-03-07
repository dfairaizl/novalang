const Generator = require('./generator');

class CodeGenerator {
  constructor (buildDir, sourceGraph) {
    this.buildDir = buildDir;
    this.sourceGraph = sourceGraph;
  }

  codegen () {
    const codeModules = this.sourceGraph.search('module');
    const buildUnits = codeModules.map((codeModule) => {
      const generator = new Generator(this.buildDir, this.sourceGraph, codeModule);

      return generator.generate();
    });

    return buildUnits;
  }
}

module.exports = CodeGenerator;
