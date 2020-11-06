/* global describe, it, expect */

const { Query } = require('@novalang/graph');

const Parser = require('../parser');
const BindingAnalyzer = require('./bindings');
const {
  ClassNotFoundError,
  FunctionNotFoundError,
  ImportNotFoundError,
  MethodNotFoundError,
  UndeclaredModuleError,
  UndeclaredVariableError
} = require('./errors');

const stdLibParser = new Parser(`
  export external function printf(format: char *, args: ...) -> Int
  export external function scanf(format: char *, args: ...) -> Int
`, 'io');

const stdLibGraph = stdLibParser.parse();

describe('Binding Analyzer', () => {
  describe('imports', () => {
    it('throws an error if the imported module is not found', () => {
      const parser = new Parser(`
        import add from 'math';
      `);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      expect(() => bindingAnalyzer.analyze()).toThrowError(UndeclaredModuleError);
    });

    it('binds imported functions to invocations', () => {
      const parser = new Parser(`import printf from 'io'; printf('hello')`);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();


      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'import_declaration' } }
      ]);
    });

    it('binds imported functions to invocations in a source file', () => {
      const parser = new Parser(`
        import printf from 'io';

        const x = 1;

        printf('hello');
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'import_declaration' } }
      ]);
    });

    it('throws an error if import declaration is not found in source module', () => {
      const parser = new Parser(`
        import malloc from 'io';
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      expect(() => bindingAnalyzer.analyze()).toThrowError(ImportNotFoundError);
    });

    it('binds imported functions to declared exports', () => {
      const parser = new Parser(`
        import printf from 'io';
        import scanf from 'io';
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'import_declaration' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', identifier: 'printf' } }
      ]);

      expect(sourceGraph.outgoing(result.binding[1], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', identifier: 'scanf' } }
      ]);
    });
  });

  describe('exports', () => {
    it('binds sources of exported functions', () => {
      const parser = new Parser(`export function double(x: Int) -> Int { return x * 2; };`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'function_argument' } }
      ]);
    });
  });

  describe('functions', () => {
    it('throws an error for invoking undefined functions', () => {
      const parser = new Parser(`speak('hello')`);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);

      expect(() => bindingAnalyzer.analyze()).toThrowError(FunctionNotFoundError);
    });

    it('binds functions to invocations with precedence over imports', () => {
      const parser = new Parser(`import printf from 'io'; function printf() {}; printf('hello')`);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds variable references to function arguments', () => {
      const parser = new Parser(`function double(x: Int) -> Int { return x * 2; };`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'function_argument' } }
      ]);
    });
  });

  describe('immutable variables', () => {
    it('throws an error referencing undefined variables', () => {
      const parser = new Parser(`x + 1`);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);

      expect(() => bindingAnalyzer.analyze()).toThrowError(UndeclaredVariableError);
    });

    it('throws an error referencing undefined variables in any scope', () => {
      const parser = new Parser(`
        const y = 2;
        function addX() -> Int {
          return x + 1;
        }
      `);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);

      expect(() => bindingAnalyzer.analyze()).toThrowError(UndeclaredVariableError);
    });

    it('binds variable references to declarations', () => {
      const parser = new Parser(`const x = 1; x + 1`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration' } }
      ]);
    });

    it('binds variable references in expressions', () => {
      const parser = new Parser(`const x = 1; let y = x`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);
    });

    it('binds multiple variable references to declarations', () => {
      const parser = new Parser(`
        const x = 1; x + 1;
        const y = 2; y + 1
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);

      expect(sourceGraph.outgoing(result.ref[1], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'y' } }
      ]);
    });

    it('binds variable references to declarations inside a lexical scope', () => {
      const parser = new Parser(`
        const x = 1;
        const y = 2;
        function addX() -> Int {
          return x + 1;
        }
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);
    });

    it('binds references to nearest declaration for shadowed variables', () => {
      const parser = new Parser(`
        const z = 7;
        function addZ() -> Int {
          let z = 2;
          return z + 1
        };
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } } // inner `z` is mutable in this case
      ]);
    });

    it('binds variable references to declarations in assignments', () => {
      const parser = new Parser(`let x = 1; x = 2`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });
  });

  describe('invocations', () => {
    it('binds functions to invocations', () => {
      const parser = new Parser(`function printf() {}; printf('hello')`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds functions to invocations in no defined order', () => {
      const parser = new Parser(`printf('hello'); function printf() {};`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds passed variable arguments to invocations', () => {
      const parser = new Parser(`
        function printf() {}

        const x = 1;

        printf(x);
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);
    });

    it('binds functions to invocations with recursion', () => {
      const parser = new Parser(`function addOne(x: Int) -> Int { return addOne(x + 1) };`);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'binding' }).returns('binding');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });
  });

  describe('loops', () => {
    it('binds expressions inside do-while loops', () => {
      const parser = new Parser(`
        let i = 0;

        do {
          i = i + 1
        } while (i < 10)
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });

    it('binds expressions inside while loops', () => {
      const parser = new Parser(`
        let i = 0;

        while (i < 10) {
          i = i + 1
        }
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });
  });

  describe('conditionals', () => {
    it('binds expressions inside if statements', () => {
      const parser = new Parser(`
        let i = 0;
        if (0 < 1) {
          i = i + 1
        }
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });

    it('binds expressions inside if/else statements', () => {
      const parser = new Parser(`
        let i;

        if (0 < 1) {
          i = 1
        } else {
          i = 2
        }
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);

      expect(sourceGraph.outgoing(result.ref[1], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });

    it('binds expressions inside if/else if/else statements', () => {
      const parser = new Parser(`
        let i;

        if (0 < 1) {
          i = 1
        } else if (1 < 2) {
          i = 2
        } else {
          i = 3
        }
      `);

      const sourceGraph = parser.parse();
      sourceGraph.merge(stdLibGraph);

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'variable_reference' }, { name: 'ref' }).returns('ref');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);

      expect(sourceGraph.outgoing(result.ref[1], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);

      expect(sourceGraph.outgoing(result.ref[2], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });
  });

  describe('class instantiation', () => {
    it('binds instantiations to class definitions', () => {
      const parser = new Parser(`
        class Calculator {}
        const x = new Calculator();
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'instantiation' }, { name: 'inst' }).returns('inst');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.inst[0], 'binding')).toMatchObject([
        { attributes: { type: 'class_definition' } }
      ]);
    });

    it('throws an error instantiating an undefined class', () => {
      const parser = new Parser(`
        class Calculator {}

        const x = new Math();
      `);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);

      expect(() => bindingAnalyzer.analyze()).toThrowError(ClassNotFoundError);
    });
  });

  describe('class instances', () => {
    it('binds invocations to class methods', () => {
      const parser = new Parser(`
        class Calculator {
          getNumber() -> Int {
            return 42;
          }
        }

        const x = new Calculator();
        x.getNumber();
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'invoke' }).returns('invoke');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.invoke[0], 'binding')).toMatchObject([
        { attributes: { type: 'method' } }
      ]);
    });

    it('binds separate invocations to class methods', () => {
      const parser = new Parser(`
        class Calculator {
          getNumber() -> Int {
            return 42;
          }

          getFloat() -> Float {
            return 10.0
          }
        }

        const x = new Calculator();
        x.getNumber();
        x.getFloat();
      `);

      const sourceGraph = parser.parse();

      const q = new Query(sourceGraph);
      const result = q.match({ type: 'invocation' }, { name: 'invoke' }).returns('invoke');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.outgoing(result.invoke[0], 'binding')).toMatchObject([
        { attributes: { type: 'method', identifier: 'getNumber' } }
      ]);

      expect(sourceGraph.outgoing(result.invoke[1], 'binding')).toMatchObject([
        { attributes: { type: 'method', identifier: 'getFloat' } }
      ]);
    });

    it('throws an error trying to reference an unknown instance', () => {
      const parser = new Parser(`
        class Calculator {}

        const x = new Calculator();
        a.unknown();
      `);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);


      expect(() => bindingAnalyzer.analyze()).toThrowError(UndeclaredVariableError);
    });

    it('throws an error trying to bind an unknown method', () => {
      const parser = new Parser(`
        class Calculator {}

        const x = new Calculator();
        x.unknown();
      `);

      const sourceGraph = parser.parse();

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);

      expect(() => bindingAnalyzer.analyze()).toThrowError(MethodNotFoundError);
    });
  });
});
