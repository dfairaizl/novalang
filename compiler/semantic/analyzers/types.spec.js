/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  MissingTypeAnnotationError,
  TypeMismatchError
} = require('../errors');

describe('Type Analyzer', () => {
  describe('immutable literal expressions', () => {
    it('checks types for number literals', () => {
      const parser = new Parser('const x = 1');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('immutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'int' });
    });

    it('checks types for string literals', () => {
      const parser = new Parser("const x = 'hello nova'");
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('immutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'string' });
    });

    it('checks types for boolean literals', () => {
      const parser = new Parser('const b = true');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('immutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'bool' });
    });
  });

  describe('immutable expressions with annotations', () => {
    it('checks types for number literals', () => {
      const parser = new Parser('const x: int = 1');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('immutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'int' });
    });
  });

  describe('mutable expressions', () => {
    it('declarations without an expression require a type annotation', () => {
      const parser = new Parser('let x');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MissingTypeAnnotationError);
    });

    it('declarations without an expression type check', () => {
      const parser = new Parser('let x: int');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('mutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'int' });
    });

    it('checks types for literal expressions by inference', () => {
      const parser = new Parser('let x = 1');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('mutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'int' });
    });

    it.only('checks types for literal expressions by inference', () => {
      const parser = new Parser('const x = 1; const y = x + 2');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      sourceGraph.debug();

      const decl = sourceGraph.search('mutable_declaration');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'int' });
    });
  });

  describe.skip('functions', () => {
    it('checks type of function with no return value', () => {
      const parser = new Parser('function doNothing() { 1 + 1 }');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('function');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'void' });
    });

    it('checks type of function by inference', () => {
      const parser = new Parser('function add() { return 1 + 1 }');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const decl = sourceGraph.search('function');
      const type = sourceGraph.relationFromNode(decl[0], 'type');

      expect(type[0].attributes).toMatchObject({ kind: 'int' });
    });
  });

  describe('type casting', () => {
    it('does not allow mismatched primitives', () => {
      const parser = new Parser('let x: int = true');
      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(TypeMismatchError);
    });
  });
});
