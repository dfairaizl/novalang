/* global describe, it, expect */

const Parser = require('../parser');
const Analyzer = require('./scope-analyzer');

describe('Scope Analyzer', () => {
  describe('variable declarations', () => {
    it.only('creates references between declarations and references', () => {
      const parser = new Parser('const x = 1; const y = x + 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);
      scopeAnalyzer.analyze();

      // console.log(require('util').inspect(sourceGraph.treeFromNode(), { depth: null }));
      console.log(sourceGraph.debug());

      expect().toBe({});
    });

    it('checks for declarations before variable can be used', () => {
      const parser = new Parser('x = 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);

      expect(() => scopeAnalyzer.analyze()).toThrow();
    });

    it.skip('creates references between declarations and references', () => {
      const parser = new Parser('let x = 0; x + 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);

      expect(() => scopeAnalyzer.analyze()).toThrow();
    });
  });
});
