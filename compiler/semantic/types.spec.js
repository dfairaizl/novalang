/* global describe, it, expect */

const Parser = require('../parser');
const Analyzer = require('./type-analyzer');

describe('Parser', () => {
  describe('literal types', () => {
    it.only('infers type of literal integer assignments', () => {
      const parser = new Parser('const x = 1');
      const parsed = parser.parse();

      const typeAnalyzer = new Analyzer(parsed);
      typeAnalyzer.analyze(parsed);

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        kind: 'int',
        identifier: 'x'
      });
    });

    it('infers type of literal string assignments', () => {
      const parser = new Parser('const x = "hello world"');
      const parsed = parser.parsePrimaryExpression();

      const typeAnalyzer = new Analyzer(parser.sourceGraph);
      typeAnalyzer.analyzeNode(parsed);

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        kind: 'string',
        identifier: 'x'
      });
    });

    it('infers type of literal boolean assignments', () => {
      const parser = new Parser('const x = false');
      const parsed = parser.parsePrimaryExpression();

      const typeAnalyzer = new Analyzer(parser.sourceGraph);
      typeAnalyzer.analyzeNode(parsed);

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        kind: 'bool',
        identifier: 'x'
      });
    });
  });

  describe('binop expressions', () => {
    it('infers type of basic functions', () => {
      const parser = new Parser('const y = 1 + 1 }');
      const parsed = parser.parsePrimaryExpression();

      const typeAnalyzer = new Analyzer(parser.sourceGraph);
      typeAnalyzer.analyzeNode(parsed);

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        kind: 'int',
        identifier: 'y'
      });
    });
  });

  describe('function types', () => {
    it('infers type of basic functions', () => {
      const parser = new Parser('function addOne(x) { return x + 1 }');
      const parsed = parser.parsePrimaryExpression();

      const typeAnalyzer = new Analyzer(parser.sourceGraph);
      typeAnalyzer.analyzeNode(parsed);

      expect(parsed.attributes).toEqual({
        type: 'function',
        kind: 'int',
        name: 'addOne'
      });
    });
  });
});
