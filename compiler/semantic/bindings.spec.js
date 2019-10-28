/* global describe, it, expect */

const Parser = require('../parser');
const BindingAnalyzer = require('./bindings');
const {
  FunctionNotFoundError,
  ImportNotFoundError,
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

      const binding = sourceGraph.search('invocation');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
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

      const binding = sourceGraph.search('invocation');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
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

      const binding = sourceGraph.search('import_declaration');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', identifier: 'printf' } }
      ]);

      expect(sourceGraph.relationFromNode(binding[1], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', identifier: 'scanf' } }
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

      const binding = sourceGraph.search('invocation');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds variable references to function arguments', () => {
      const parser = new Parser(`function double(x: Int) -> Int { return x * 2; };`);

      const sourceGraph = parser.parse();

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
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

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration' } }
      ]);
    });

    it('binds multiple variable references to declarations', () => {
      const parser = new Parser(`
        const x = 1; x + 1;
        const y = 2; y + 1
      `);

      const sourceGraph = parser.parse();

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);

      expect(sourceGraph.relationFromNode(binding[1], 'binding')).toMatchObject([
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

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
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

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } } // inner `z` is mutable in this case
      ]);
    });

    it('binds variable references to declarations in assignments', () => {
      const parser = new Parser(`let x = 1; x = 2`);

      const sourceGraph = parser.parse();

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);
    });
  });

  describe('invocations', () => {
    it('binds functions to invocations', () => {
      const parser = new Parser(`function printf() {}; printf('hello')`);

      const sourceGraph = parser.parse();

      const binding = sourceGraph.search('invocation');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds functions to invocations in no defined order', () => {
      const parser = new Parser(`printf('hello'); function printf() {};`);

      const sourceGraph = parser.parse();

      const binding = sourceGraph.search('invocation');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds passed variable arguments to declarations', () => {
      const parser = new Parser(`
        function printf() {}

        const x = 1;

        printf(x);
      `);

      const sourceGraph = parser.parse();

      const binding = sourceGraph.search('variable_reference');

      const bindingAnalyzer = new BindingAnalyzer(sourceGraph);
      bindingAnalyzer.analyze();

      expect(sourceGraph.relationFromNode(binding[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);
    });
  });
});