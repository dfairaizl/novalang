/* global describe, it, expect */

const { Query } = require('@novalang/graph');

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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'dec' }).returns('dec');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.dec[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'Int' } }
      ]);
    });

    it('resolves type of float literals', () => {
      const parser = new Parser('const x = 1.0;');

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'dec' }).returns('dec');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.dec[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'Float' } }
      ]);
    });

    it('resolves type of boolean literals', () => {
      const parser = new Parser('const x = false;');

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'dec' }).returns('dec');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.dec[0], 'type')).toMatchObject([
        { attributes: { type: 'type', kind: 'Boolean' } }
      ]);
    });

    it('resolves type of string literals', () => {
      const parser = new Parser(`const x = 'hello nova';`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'dec' }).returns('dec');

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.dec[0], 'type')).toMatchObject([
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'mut' }).returns('mut');

      expect(sourceGraph.outgoing(result.mut[0], 'type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves type when annotation and expression types are the same', () => {
      const parser = new Parser('let x: Int = 10');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'mut' }).returns('mut');

      expect(sourceGraph.outgoing(result.mut[0], 'type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('infers type when no annotation is provided', () => {
      const parser = new Parser('let x = 10');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'mut' }).returns('mut');

      expect(sourceGraph.outgoing(result.mut[0], 'type')[0].attributes).toMatchObject({
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'immutable' }).returns('immutable');

      expect(sourceGraph.outgoing(result.immutable[0], 'type')[0].attributes).toMatchObject({
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'ref' }).returns('ref');

      const yNode = result.ref[0];
      const type = sourceGraph.outgoing(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('infers types of variables in binary operations', () => {
      const parser = new Parser('const x = 1; let y = x * 2;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'ref' }).returns('ref');

      const yNode = result.ref[0];
      const type = sourceGraph.outgoing(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves types of variable references in binary operations', () => {
      const parser = new Parser('const x = 1; let y = x * x;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'ref' }).returns('ref');

      const yNode = result.ref[0];
      const type = sourceGraph.outgoing(yNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('resolves types of variables in nested binary operations', () => {
      const parser = new Parser('const x = 1; let y = x * 2 + 1;');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'mutable_declaration' }, { name: 'ref' }).returns('ref');

      const yNode = result.ref[0];
      const type = sourceGraph.outgoing(yNode, 'type');
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

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(MismatchedReturnTypeError);
    });

    it('checks return statements against return type', () => {
      const parser = new Parser('function one() -> Int { return 1 }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(MismatchedReturnTypeError);
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

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(MismatchedReturnTypeError);
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

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(MismatchedReturnTypeError);
    });

    it('checks functions with multiple return statements', () => {
      const parser = new Parser(`
        function decide(n: Int) -> Float {
          if (n <= 1) {
            return 1;
          }

          return 1.0;
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(MismatchedReturnTypeError);
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'function_argument' }, { name: 'arg' }).returns('arg');

      const argNode = result.arg[0];

      const type = sourceGraph.outgoing(argNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });

    it('builds types for functions with multiple arguments', () => {
      const parser = new Parser('function add(x: Int, y: Int) -> Int { return x + y }');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'function_argument' }, { name: 'arg' }).returns('arg');

      const argNode1 = result.arg[0];
      const argNode2 = result.arg[1];

      const xType = sourceGraph.outgoing(argNode1, 'type')[0];
      const yType = sourceGraph.outgoing(argNode2, 'type')[0];

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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'decl' }).returns('decl');

      const declNode = result.decl[0];
      const type = sourceGraph.outgoing(declNode, 'type');
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'function' }, { name: 'func' }).returns('func');

      const funcNode = result.func[0];
      const type = sourceGraph.outgoing(funcNode, 'type');
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'function' }, { name: 'func' }).returns('func');

      const funcNode = result.func[0];

      const type = sourceGraph.outgoing(funcNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe('class definitions', () => {
    it('builds types for class definitions', () => {
      const parser = new Parser('class Calculator {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'class_definition' }, { name: 'classDef' }).returns('classDef');

      const type = sourceGraph.outgoing(result.classDef[0], 'type');

      expect(type[0].attributes).toMatchObject({
        kind: 'Calculator'
      });
    });

    it.skip('throws and error if classes are defined more than once', () => {
      const parser = new Parser('class Calculator {}; class Calculator {}');

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      expect(() => semanticAnalyzer.analyze()).toThrowError(DuplicateTypeError);
    });
  });

  describe('class methods', () => {
    it('builds method return types', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn() -> Bool {}
        }
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'method' }, { name: 'methods' }).returns('methods');

      const type = sourceGraph.outgoing(result.methods[0], 'type');
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'method' }, { name: 'methods' }).returns('methods');

      const type = sourceGraph.outgoing(result.methods[0], 'type');
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'function_argument' }, { name: 'args' }).returns('args');

      const type = sourceGraph.outgoing(result.args[0], 'type');
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

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'function_argument' }, { name: 'args' }).returns('args');

      expect(sourceGraph.outgoing(result.args[0], 'type')[0].attributes).toMatchObject({
        kind: 'Int'
      });

      expect(sourceGraph.outgoing(result.args[1], 'type')[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });

  describe('class instantiation', () => {
    it('builds types for class definitions', () => {
      const parser = new Parser(`
        class Calculator {}
        const x = new Calculator();
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'immutable_declaration' }, { name: 'decl' }).returns('decl');

      const type = sourceGraph.outgoing(result.decl[0], 'type');

      expect(type[0].attributes).toMatchObject({
        kind: 'Calculator'
      });
    });
  });

  describe('class instances', () => {
    it('builds types for invoked methods', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn() {
          }
        }

        const x = new Calculator();
        x.turnOn();
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'invoke' }).returns('invoke');

      const type = sourceGraph.outgoing(result.invoke[0], 'type');

      expect(type[0].attributes).toMatchObject({
        kind: 'Void'
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
      const binding = sourceGraph.outgoing(xNode, 'binding')[0];
      const type = sourceGraph.outgoing(binding, 'type');

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
      const type = sourceGraph.outgoing(zNode, 'type');
      expect(type[0].attributes).toMatchObject({
        kind: 'Int'
      });
    });
  });
});
