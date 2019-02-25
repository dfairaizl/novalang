/* global describe, it, expect */

const Parser = require('../parser');
const Analyzer = require('./scope-analyzer');

describe('Scope Analyzer', () => {
  describe('variable declarations', () => {
    it('creates bindings between immnutable declarations and references', () => {
      const parser = new Parser('const x = 1; const y = x + 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);
      scopeAnalyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(node[0].attributes.identifier).toBe('x');
      expect(sourceGraph.relationFromNode(node[0], 'binding')).toBeDefined();
    });

    it('creates bindings between mutable declarations and references', () => {
      const parser = new Parser('let x = 1; let y = x + 1');
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
      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration' } }
      ]);
    });

    it('fails to use variable in a declaration expression', () => {
      const parser = new Parser('x = x + 1');
      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);

      expect(() => scopeAnalyzer.analyze()).toThrow();
    });
  });

  describe('function arguments', () => {
    it('creates references to function arguments', () => {
      const parser = new Parser(`
        function addOne(z) { return z + 1 };
      `);

      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);
      scopeAnalyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(node[0].attributes.identifier).toBe('z');
      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'function_argument' } }
      ]);
    });
  });

  describe('function invocations', () => {
    it('creates references to functions for invocations', () => {
      const parser = new Parser(`
        function addOne(z) { return z + 1 };
        addOne(10);
      `);

      const sourceGraph = parser.parse();

      const scopeAnalyzer = new Analyzer(sourceGraph);
      scopeAnalyzer.analyze();

      const node = sourceGraph.search('invocation');

      expect(sourceGraph.relationFromNode(node[0], 'function_binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });
  });
});
