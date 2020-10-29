const { Query } = require('@novalang/graph');
const Generator = require('./generator');

class CodeGenerator {
  constructor (buildDir, sourceGraph) {
    this.buildDir = buildDir;
    this.sourceGraph = sourceGraph;
  }

  codegen () {
    const sourceQuery = new Query(this.sourceGraph);
    const results = sourceQuery
      .match({ type: 'module' }, { name: 'modules' })
      .returns('modules');

    const buildUnits = results.modules.map((codeModule) => {
      const generator = new Generator(this.buildDir, this.sourceGraph, codeModule);

      return generator.generate();
    });

    return buildUnits;
  }
}

module.exports = CodeGenerator;
