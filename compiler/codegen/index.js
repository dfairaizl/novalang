const Generator = require('./generator');

class CodeGenerator {
  constructor (buildDir, sourceGraph) {
    this.buildDir = buildDir;
    this.sourceGraph = sourceGraph;
  }

  codegen () {
    const sourceQuery = this.sourceGraph.query();
    const sources = sourceQuery
      .match({ type: 'module' })
      .execute();

    const buildUnits = sources.nodes().map((codeModule) => {
      const generator = new Generator(this.buildDir, this.sourceGraph, codeModule);

      return generator.generate();
    });

    return buildUnits;
  }
}

module.exports = CodeGenerator;
