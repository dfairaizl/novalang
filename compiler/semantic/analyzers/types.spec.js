/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
// const {
//   MissingTypeAnnotationError,
//   TypeMismatchError
// } = require('../errors');

describe('Type Analyzer', () => {
  describe('literal types', () => {
    it('resolves type of integer literals', () => {
      const parser = new Parser('const x = 1;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves type of float literals', () => {
      const parser = new Parser('const x = 1.0;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Float'
      });
    });

    it('resolves type of boolean literals', () => {
      const parser = new Parser('const x = false;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'bool'
      });
    });

    it('resolves type of string literals', () => {
      const parser = new Parser(`const x = 'hello nova';`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'String'
      });
    });
  });

  describe('variable reference expressions', () => {
    it('resolves types of variables in assignment', () => {
      const parser = new Parser('const x = 1; let y = x;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('mutable_declaration')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves types of variables in binary operations', () => {
      const parser = new Parser('const x = 1; let y = x * 2;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('mutable_declaration')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves types of variable references in binary operations', () => {
      const parser = new Parser('const x = 1; let y = x * x;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('mutable_declaration')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves types of variables in nested binary operations', () => {
      const parser = new Parser('const x = 1; let y = x * 2 + 1;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('mutable_declaration')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe('function types', () => {
    it('types void functions', () => {
      const parser = new Parser('function sayHello() {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(yNode, 'return_type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Void'
      });
    });

    it('types functions with return type', () => {
      const parser = new Parser('function getHello() -> String {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(yNode, 'return_type');
      expect(type[0].attributes).toMatchObject({
        kind: 'String'
      });
    });
  });
});
