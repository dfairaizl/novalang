/* global describe, it, expect */

const Parser = require('../../parser');
const ScopeAnalyzer = require('./scope');
const {
  ClassNotFoundError
} = require('../errors');

describe.skips('Scope Analyzer', () => {
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
