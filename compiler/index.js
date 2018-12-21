const { resolve } = require('path');
const { readFileSync } = require('fs');

const Parser = require('./parser');

class Compiler {
  constructor (entrySource, options) {
    this.baseDir = resolve(__dirname, '..', 'examples');
    this.sources = [entrySource];
    this.options = {
      debugGraph: false,
      ...options
    };

    this.sourceModules = [];
  }

  compile () {
    // parse the entry souce code
    while (this.sources.length > 0) {
      const currentSource = this.sources.pop();
      const sourceGraph = this.parse(currentSource);

      this.sourceModules.push(sourceGraph);

      const dependantModules = sourceGraph.search('require_statement');
      dependantModules.forEach((m) => {
        const source = sourceGraph.relationFromNode(m, 'module');
        this.sources.push(`${source[0].attributes.value}.nv`);
      });
    }

    if (this.options.debugGraph) {
      this.sourceModules[0].debug();
    }
  }

  parse (sourceCode) {
    return this.parseModule(sourceCode);
  }

  parseModule (moduleSource) {
    const sourceFile = this.readSource(moduleSource);
    const parser = new Parser(sourceFile);

    return parser.parse();
  }

  readSource (sourceFile) {
    const path = resolve(this.baseDir, sourceFile);
    console.log('Compiling', path);
    return readFileSync(path);
  }
}

module.exports = Compiler;
