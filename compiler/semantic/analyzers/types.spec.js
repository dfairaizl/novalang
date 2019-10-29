/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  DuplicateTypeError,
  MissingTypeAnnotationError,
  TypeMismatchError,
  MismatchedReturnTypeError,
  VoidFunctionReturnError
} = require('../errors');

describe('Type Analyzer', () => {
  describe('literal types', () => {
    it('resolves type of integer literals', () => {
      const parser = new Parser('const x = 1;');

      const sourceGraph = parser.parse();

      const typedNode = sourceGraph.search('immutable_declaration');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(typedNode[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'Int' } }
      ]);
    });

    it('resolves type of float literals', () => {
      const parser = new Parser('const x = 1.0;');

      const sourceGraph = parser.parse();

      const typedNode = sourceGraph.search('immutable_declaration');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(typedNode[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'Float' } }
      ]);
    });

    it('resolves type of boolean literals', () => {
      const parser = new Parser('const x = false;');

      const sourceGraph = parser.parse();

      const typedNode = sourceGraph.search('immutable_declaration');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(typedNode[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'Boolean' } }
      ]);
    });

    it('resolves type of string literals', () => {
      const parser = new Parser(`const x = 'hello nova';`);

      const sourceGraph = parser.parse();

      const typedNode = sourceGraph.search('immutable_declaration');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(typedNode[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'String' } }
      ]);
    });
  });

  describe('mutable expressions', () => {
    it('uses annotated type if no expression is present', () => {
      const parser = new Parser('let x: Int');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves type when annotation and expression types are the same', () => {
      const parser = new Parser('let x: Int = 10');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('infers type when no annotation is provided', () => {
      const parser = new Parser('let x = 10');

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

  describe('immutable expressions', () => {
    it('infers type when no annotation is provided', () => {
      const parser = new Parser('const x = 10');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.search('type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe('variable reference expressions', () => {
    it('infers types of variables in assignment', () => {
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

    it('infers types of variables in binary operations', () => {
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
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Void'
      });
    });

    it('checks return statements against return type', () => {
      const parser = new Parser('function one() -> Int { return 1 }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('checks return statements against return type expressions', () => {
      const parser = new Parser(`
        function one() -> Int {
          const x = 1;
          return x;
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('infers return type for functions with arguments used in body expressions', () => {
      const parser = new Parser(`
        function addComplex(a: Int) -> Int {
          const x = 2;
          return a + x;
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function_argument')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
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

      const xNode = sourceGraph.search('function_argument')[0];
      const yNode = sourceGraph.search('function_argument')[1];

      const xType = sourceGraph.relationFromNode(xNode, 'type')[0];
      const yType = sourceGraph.relationFromNode(yNode, 'type')[0];

      expect(xType.attributes).toMatchObject({
        kind: 'Int'
      });

      expect(yType.attributes).toMatchObject({
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

    it('builds types for invocations of recursive functions', () => {
      const parser = new Parser(`
        function one(x: Int) -> Int { return one(1) }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe('exports', () => {
    it('builds types for exported functions', () => {
      const parser = new Parser('export function one() -> Int {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const funcNode = sourceGraph.search('function')[0];
      const type = sourceGraph.relationFromNode(funcNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe.skip('class definitions', () => {
    it('builds types for class definitions', () => {
      const parser = new Parser('class Calculator {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('class_definition')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Calculator'
      });
    });

    it('throws and error if classes are defined more than once', () => {
      const parser = new Parser('class Calculator {}; class Calculator {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(DuplicateTypeError);
    });
  });

  describe.skip('class methods', () => {
    it('builds method return types', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn() -> Bool {}
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('method')[0];
      const type = sourceGraph.relationFromNode(yNode, 'return_type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Bool'
      });
    });

    it('builds methods with Void return type', () => {
      const parser = new Parser(`
        class Calculator {
          turnOff() {}
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('method')[0];
      const type = sourceGraph.relationFromNode(yNode, 'return_type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Void'
      });
    });

    it('builds types for methods with a single argument', () => {
      const parser = new Parser(`
        class Math {
          addOne(x: Int) -> Int {}
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const yNode = sourceGraph.search('function_argument')[0];
      const type = sourceGraph.relationFromNode(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('builds types for methods with multiple arguments', () => {
      const parser = new Parser(`
        class Math {
          add(x: Int, y: Int) -> Int {}
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const args = sourceGraph.search('function_argument');
      const typeX = sourceGraph.relationFromNode(args[0], 'type');
      const typeY = sourceGraph.relationFromNode(args[1], 'type');

      expect(typeX[0].attributes).toMatchObject({
        kind: 'Int'
      });

      expect(typeY[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe.skip('class instantiation', () => {
    it('builds types for class definitions', () => {
      const parser = new Parser(`
        class Calculator {}
        const x = new Calculator();
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const xNode = sourceGraph.search('immutable_declaration')[0];
      const type = sourceGraph.relationFromNode(xNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Calculator'
      });
    });
  });

  describe.skip('class instance variables', () => {
    it('types instance variables', () => {
      const parser = new Parser(`
        class Calculator {
          let x: Int
          const PI = 3.14

          constructor () {
            this.x = 1
          }
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const xNode = sourceGraph.search('key_reference')[0];
      const binding = sourceGraph.relationFromNode(xNode, 'binding')[0];
      const type = sourceGraph.relationFromNode(binding, 'type');

      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe.skip('imports', () => {
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
