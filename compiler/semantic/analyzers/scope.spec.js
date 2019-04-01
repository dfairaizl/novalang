/* global describe, it, expect */

const Parser = require('../../parser');
const SemanticAnalyzer = require('..');
const {
  ClassNotFoundError,
  FunctionNotFoundError,
  UndeclaredVariableError
} = require('../errors');

describe('Scope Analyzer', () => {
  describe('variable references', () => {
    it('throws an exception for use of undeclared variables', () => {
      const parser = new Parser(`
        let z = 1; y + 1;
      `);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(UndeclaredVariableError);
    });

    it('it binds references to a declaration', () => {
      const parser = new Parser(`
        let z = 1; z + 1;
      `);

      const sourceGraph = parser.parse();

      const ref = sourceGraph.search('variable_reference');
      const decl = sourceGraph.search('mutable_declaration');

      const analyzer = new SemanticAnalyzer(sourceGraph);
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

      const analyzer = new SemanticAnalyzer(sourceGraph);
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

      const analyzer = new SemanticAnalyzer(sourceGraph);
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

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } } // inner `z` is mutable in this case
      ]);
    });
  });

  describe('function references', () => {
    it('throws an exception for use of undeclared variables', () => {
      const parser = new Parser(`
        let z = function incr(x: Int) -> Int { return x + 1 };
        z(1);
      `);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('invocation');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'mutable_declaration' } } // inner `z` is mutable in this case
      ]);
    });
  });

  describe('variable declarations', () => {
    it('binds references to function arguments', () => {
      const parser = new Parser(`
        let z = 1; z + 1;
      `);

      const sourceGraph = parser.parse();

      const ref = sourceGraph.search('mutable_declaration');

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'reference')).toMatchObject([
        { attributes: { type: 'variable_reference' } }
      ]);
    });
  });

  describe('import declarations', () => {
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

      const ref = sourceGraph.search('invocation');

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'import_declaration' } }
      ]);
    });
  });

  describe('function arguments', () => {
    it('it binds references to function arguments', () => {
      const parser = new Parser(`
        function addOne(z: Int) -> Int { return z + 1 };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('variable_reference');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'function_argument' } }
      ]);
    });
  });

  describe('function invocations', () => {
    it('throws an exception invoking  undeclared functions', () => {
      const parser = new Parser(`addOne(5);`);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(FunctionNotFoundError);
    });

    it('it binds function declaration to invocations', () => {
      const parser = new Parser(`
        addOne(1);
        function addOne() { };
      `);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      const node = sourceGraph.search('invocation');

      expect(sourceGraph.relationFromNode(node[0], 'binding')).toMatchObject([
        { attributes: { type: 'function', name: 'addOne' } }
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

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      expect(sourceGraph.relationFromNode(ref[0], 'reference')).toMatchObject([
        { attributes: { type: 'invocation' } }
      ]);
    });
  });

  // describe('class definitions', () => {
  //   it('')
  // });

  describe('class instantiations ', () => {
    it('binds instantiations to the class definition', () => {
      const parser = new Parser(`
        class Calculator {}
        new Calculator();
      `);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      analyzer.analyze();

      const iRef = sourceGraph.search('instantiation');

      expect(sourceGraph.relationFromNode(iRef[0], 'binding')).toMatchObject([
        { attributes: { type: 'class_definition', identifier: 'Calculator' } }
      ]);

      const cRef = sourceGraph.search('class_definition');

      expect(sourceGraph.relationFromNode(cRef[0], 'reference')).toMatchObject([
        { attributes: { type: 'instantiation', class: 'Calculator' } }
      ]);
    });

    it('thorws an error instantiating an undefined class', () => {
      const parser = new Parser(`
        new Calculator();
      `);

      const sourceGraph = parser.parse();

      const analyzer = new SemanticAnalyzer(sourceGraph);
      expect(() => analyzer.analyze()).toThrowError(ClassNotFoundError);
    });
  });
});
