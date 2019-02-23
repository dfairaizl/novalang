/* global describe, it, expect */

const Parser = require('../parser');
const Analyzer = require('./scope-analyzer');

describe('Scope Analyzer', () => {
  describe('variable declarations', () => {
    it('creates bindings between declarations and references', () => {
      const parser = new Parser('const x = 1; const y = x + 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);
      scopeAnalyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(node[0].attributes.identifier).toBe('x');
      expect(sourceGraph.relationFromNode(node[0], 'binding')).toBeDefined();
    });

    it('checks for bindings before variable can be used', () => {
      const parser = new Parser('x = 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);

      expect(() => scopeAnalyzer.analyze()).toThrow();
    });

    it('checks for bindings in a closure', () => {
      const parser = new Parser(`
        const x = 1;
        function addX() { return x + 1 };
      `);
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);
      scopeAnalyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(node[0].attributes.identifier).toBe('x');
      expect(sourceGraph.relationFromNode(node[0], 'binding')).toBeDefined();
    });

    it('fails to use variable in a declaration expression', () => {
      const parser = new Parser('x = x + 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);

      expect(() => scopeAnalyzer.analyze()).toThrow();
    });
  });
});
