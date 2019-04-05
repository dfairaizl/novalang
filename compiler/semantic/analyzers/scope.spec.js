/* global describe, it, expect */

const Parser = require('../../parser');
const ScopeAnalyzer = require('./scope');
const {
  ClassNotFoundError,
  FunctionNotFoundError,
  NoMatchingModuleExport,
  UndeclaredModuleError,
  UndeclaredVariableError
} = require('../errors');

describe('Scope Analyzer', () => {
  describe('variable references', () => {
    it('throws an exception for use of undeclared variables', () => {
      const parser = new Parser(`
        let z = 1; y + 1;
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(UndeclaredVariableError);
    });

    it('it binds references to a declaration', () => {
      const parser = new Parser(`
        let z = 1; z + 1;
      `);

      const sourceGraph = parser.parse();

      const ref = sourceGraph.search('variable_reference');
      const decl = sourceGraph.search('mutable_declaration');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } }
      ]);

      expect(sourceGraph.relationFromNode(decl[0], 'reference')).toMatchObject([
        { attributes: { type: 'variable_reference' } }
      ]);
    });

    it('it binds references to a multiple declarations', () => {
      const parser = new Parser(`
        let x = 1; x + 1;
        let y = 2; y + 2;
      `);

      const sourceGraph = parser.parse();

      const ref = sourceGraph.search('variable_reference');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration', identifier: 'x' } }
      ]);

      expect(sourceGraph.relationFromNode(ref[1], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration', identifier: 'y' } }
      ]);
    });

    it('it binds references to declarations in a nested scope', () => {
      const parser = new Parser(`
        const z = 7;
        function addZ() -> Int { return z + 1 };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration' } }
      ]);
    });

    it('it binds references to nearest declaration for shadowed variables', () => {
      const parser = new Parser(`
        const z = 7;
        function addZ() -> Int {
          let z = 2;
          return z + 1
        };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } } // inner `z` is mutable in this case
      ]);
    });
  });

  describe('variable declarations', () => {
    it('declarations have references to bindings', () => {
      const parser = new Parser(`
        let z = 1;
        z + 1;
      `);

      const sourceGraph = parser.parse();

      const ref = sourceGraph.search('mutable_declaration');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'reference')).toMatchObject([
        { attributes: { type: 'variable_reference' } }
      ]);
    });
  });

  describe('import declarations', () => {
    it('throws an error if the imported modules is not found', () => {
      const parser = new Parser(`
        import add from 'math';
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(UndeclaredModuleError);
    });

    it('throws an error if the import was not found in source module', () => {
      const libParser = new Parser(`
        export function subtract(x: Int, y: Int) -> Int {}
      `, 'math');

      const parser = new Parser(`
        import add from 'math';
      `);

      const libGraph = libParser.parse();
      const sourceGraph = parser.parse();

      sourceGraph.merge(libGraph);

      const analyzer = new ScopeAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(NoMatchingModuleExport);
    });

    it('binds imported identifiers to their exports in source module', () => {
      const libParser = new Parser(`
        export function add(x: Int, y: Int) -> Int {}
      `, 'math');

      const parser = new Parser(`
        import add from 'math';
      `);

      const libGraph = libParser.parse();
      const sourceGraph = parser.parse();

      sourceGraph.merge(libGraph);

      const ref = sourceGraph.search('import_declaration');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'function' } }
      ]);
    });

    it('binds imported identifiers to their exports in source module', () => {
      const libParser = new Parser(`
        export external function printf(format: char *, args: ...) -> Int
      `, 'io');

      const parser = new Parser(`
        import printf from 'io';
      `);

      const libGraph = libParser.parse();
      const sourceGraph = parser.parse();

      sourceGraph.merge(libGraph);

      const ref = sourceGraph.search('import_declaration');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'external_function' } }
      ]);
    });
  });

  describe('import references', () => {
    it('binds references to imported identifiers', () => {
      const libParser = new Parser(`
        export function add(x: Int, y: Int) -> Int {}
      `, 'math');

      const parser = new Parser(`
        import add from 'math';
        add(1, 2);
      `);

      const libGraph = libParser.parse();
      const sourceGraph = parser.parse();

      sourceGraph.merge(libGraph);

      const ref = sourceGraph.search('invocation');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'import_declaration' } }
      ]);
    });
  });

  describe('function arguments', () => {
    it('it binds references to function arguments', () => {
      const parser = new Parser(`
        function addOne(z: Int) -> Int { return z };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'function_argument', identifier: 'z' } }
      ]);
    });

    it('it binds references to function arguments in expressions', () => {
      const parser = new Parser(`
        function addOne(z: Int) -> Int { return z + 1 };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'function_argument', identifier: 'z' } }
      ]);
    });
  });

  describe('function invocations', () => {
    it('throws an exception invoking undeclared functions', () => {
      const parser = new Parser(`addOne(5);`);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(FunctionNotFoundError);
    });

    it('it binds function declaration to invocations', () => {
      const parser = new Parser(`
        addOne(1);
        function addOne() { };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('invocation');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'function', identifier: 'addOne' } }
      ]);
    });

    it('it binds invocation arguments', () => {
      const parser = new Parser(`
        function addOne(x: Int) { };
        const x = 1;
        addOne(x);
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('invocation')[0];
      const arg = sourceGraph.relationFromNode(node, 'arguments');

      expect(sourceGraph.relationFromNode(arg[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'x' } }
      ]);
    });
  });

  describe('function declarations', () => {
    it('binds references to function declarations', () => {
      const parser = new Parser(`
        addOne(1);
        function addOne() { };
      `);

      const sourceGraph = parser.parse();

      const ref = sourceGraph.search('function');

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'reference')).toMatchObject([
        { attributes: { type: 'invocation' } }
      ]);
    });
  });

  describe('class instantiations ', () => {
    it('binds instantiations to the class definition', () => {
      const parser = new Parser(`
        class Calculator {}
        new Calculator();
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const instance = sourceGraph.search('instantiation');

      expect(sourceGraph.relationFromNode(instance[0], 'binding')).toMatchObject([
        { attributes: { type: 'class_definition', identifier: 'Calculator' } }
      ]);

      const cRef = sourceGraph.search('class_definition');

      expect(sourceGraph.relationFromNode(cRef[0], 'reference')).toMatchObject([
        { attributes: { type: 'instantiation', identifier: 'Calculator' } }
      ]);
    });

    it('binds instance declarations to the class definition', () => {
      const parser = new Parser(`
        class Calculator {}
        const a = new Calculator();
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const instance = sourceGraph.search('instantiation');

      expect(sourceGraph.relationFromNode(instance[0], 'binding')).toMatchObject([
        { attributes: { type: 'class_definition', identifier: 'Calculator' } }
      ]);

      const cRef = sourceGraph.search('class_definition');

      expect(sourceGraph.relationFromNode(cRef[0], 'reference')).toMatchObject([
        { attributes: { type: 'instantiation', identifier: 'Calculator' } }
      ]);
    });

    it('instantiations can be stored in variables', () => {
      const parser = new Parser(`
        class Calculator {}
        const c = new Calculator();
        const a = c;
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const ref = sourceGraph.search('variable_reference');
      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'c' } }
      ]);
    });

    it('thorws an error instantiating an undefined class', () => {
      const parser = new Parser(`
        new Calculator();
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(ClassNotFoundError);
    });
  });

  describe('class instance variables', () => {
    it('binds instance references to the declarations', () => {
      const parser = new Parser(`
        class Calculator {
          let x: Int
          const PI = 3.14

          constructor () {
            this.x = 10;
          }
        }
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const iRef = sourceGraph.search('key_reference');

      expect(sourceGraph.relationFromNode(iRef[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration', identifier: 'x' } }
      ]);
    });
  });

  describe('instance accessors', () => {
    it('binds objects references to their instance', () => {
      const parser = new Parser(`
        class Calculator {
          let x: Int
        }

        const c = new Calculator();
        c.x
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const objRef = sourceGraph.search('object_reference');

      expect(sourceGraph.relationFromNode(objRef[0], 'binding')).toMatchObject([
        { attributes: { type: 'immutable_declaration', identifier: 'c' } }
      ]);
    });

    it('creates reference to class declaration', () => {
      const parser = new Parser(`
        class Calculator {
          let x: Int
        }

        const c = new Calculator();
        c.x
      `);

      const sourceGraph = parser.parse();

      const analyzer = new ScopeAnalyzer(sourceGraph);
      analyzer.analyze();

      const objRef = sourceGraph.search('object_reference');

      expect(sourceGraph.relationFromNode(objRef[0], 'definition')).toMatchObject([
        { attributes: { type: 'class_definition', identifier: 'Calculator' } }
      ]);
    });
  });
});
