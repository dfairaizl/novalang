/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  MissingTypeAnnotationError,
  TypeMismatchError,
  MismatchedReturnTypeError,
  VoidAssignmentError,
  VoidFunctionReturnError
} = require('../errors');

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

  describe('mutable expressions', () => {
    it('uses annotated type if no expression is present', () => {
      const parser = new Parser('let x: Int;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('defines type when annotation and expression types are the same', () => {
      const parser = new Parser('let x: Int = 10');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('throws an error for mutable expressions that do not have a type', () => {
      const parser = new Parser('let x');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MissingTypeAnnotationError);
    });

    it('throws an error for mutable expressions that have no inferred type', () => {
      const parser = new Parser('let x; let y = x');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MissingTypeAnnotationError);
    });

    it('throws an error if annotated type and expression type do not match', () => {
      const parser = new Parser('let x: Int = false');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(TypeMismatchError);
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

  describe('binary expressions', () => {
    it('throws an error if values in a binary expression do not match', () => {
      const parser = new Parser('const x = false + 1');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(TypeMismatchError);
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

    it('checks return statements against return type', () => {
      const parser = new Parser('function one() -> Int { return 1 }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(yNode, 'return_type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('throws an error if return does not match function return type', () => {
      const parser = new Parser('function guess() -> Int { return false }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MismatchedReturnTypeError);
    });

    it('throws an error if void function returns a value', () => {
      const parser = new Parser('function guess() { return false }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(VoidFunctionReturnError);
    });
  });

  describe('function arguments', () => {
    it('throws an error if arguments have no type annotation', () => {
      const parser = new Parser('function rollDie(sides) { return 1 }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MissingTypeAnnotationError);
    });

    it('throws an error if returned value does not match function return type', () => {
      const parser = new Parser('function getX(x: Int) -> String { return x }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MismatchedReturnTypeError);
    });

    it('builds types for functions with a single argument', () => {
      const parser = new Parser('function addOne(x: Int) -> Int { return x + 1 }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function_argument')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('builds types for functions with multiple arguments', () => {
      const parser = new Parser('function add(x: Int, y: Int) -> Int { return x + y }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function_argument')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');

      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });

      expect(type[1].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe('function invocations', () => {
    it('builds types for variables from function invocations', () => {
      const parser = new Parser(`
        function one() -> Int { return 1 }
        const x = one();
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('immutable_declaration')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('throws an errow when immutable declarations are assigned to void functions', () => {
      const parser = new Parser(`
        function test() {}
        const x = test();
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(VoidAssignmentError);
    });

    it('throws an errow when mutable declarations are assigned to void functions', () => {
      const parser = new Parser(`
        function test() {}
        let x = test();
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(VoidAssignmentError);
    });
  });

  describe('imports', () => {
    it('binds references to imported functions', () => {
      const libParser = new Parser(`
        export function add(x: Int, y: Int) -> Int {}
      `, 'math');

      const parser = new Parser(`
        import add from 'math';
        let z: Int = add(1, 1);
      `);

      const lib = libParser.parse();
      const sourceGraph = parser.parse();

      sourceGraph.merge(lib);

      const analyzer = new Analyzer(sourceGraph);
      analyzer.analyze();

      const zNode = sourceGraph.search('import_declaration')[0];
      const type = sourceGraph.relationFromNode(zNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });
});
