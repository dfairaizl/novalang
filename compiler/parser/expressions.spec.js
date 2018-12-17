/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('syntax', () => {
    it('throws an error for invalid syntax', () => {
      const parser = new Parser('const x 1');
      expect(() => {
        parser.parsePrimaryExpression();
      }).toThrow();
    });
  });

  describe('end of input', () => {
    it('does not parse after EOF', () => {
      const parser = new Parser('const x = 1');

      expect(parser.parsePrimaryExpression()).toBeTruthy();
      expect(parser.parsePrimaryExpression()).not.toBeDefined();
    });
  });

  describe('code modules', () => {
    it('creates a new module to hold parsed code', () => {
      const parser = new Parser('const x = 1');

      const codeModule = parser.parse();
      expect(codeModule.attributes).toEqual({ type: 'module' });
    });
  });

  describe('multile statements', () => {
    it('one per line', () => {
      const parser = new Parser(`
        const x = 1
        const y = 2
      `);

      expect(parser.parsePrimaryExpression().attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'x'
      });

      expect(parser.parsePrimaryExpression().attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'y'
      });
    });

    it('delimits statements based on semicolons', () => {
      const parser = new Parser('const x = 1; const y = 2');

      expect(parser.parsePrimaryExpression().attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'x'
      });

      expect(parser.parsePrimaryExpression().attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'y'
      });
    });

    it('delimits binary expressions between semicolons', () => {
      const parser = new Parser('const x = 1 + 2; const y = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'bin_op',
          operator: '+',
          left: [{
            type: 'number_literal',
            value: '1'
          }],
          right: [{
            type: 'number_literal',
            value: '2'
          }]
        }]
      });
    });
  });

  describe('variable declarations', () => {
    it('parses immutable variables with number literal assignment', () => {
      const parser = new Parser('const x = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'x'
      });
    });

    it('parses immutable variables with identifier assignment', () => {
      const parser = new Parser('const x = y');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'x'
      });
    });

    it('parses immutable variables with function invocation assignment', () => {
      const parser = new Parser('const x = sqrt(9)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{ type: 'invocation', name: 'sqrt', args: ['9'] }]
      });
    });

    it('parses immutable variables with binary expression assignment', () => {
      const parser = new Parser('const x = 1 + 2');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'bin_op',
          operator: '+',
          left: [{
            type: 'number_literal',
            value: '1'
          }],
          right: [{
            type: 'number_literal',
            value: '2'
          }]
        }]
      });
    });

    it('parses mutable variable delcarations with no assignment', () => {
      const parser = new Parser('let x');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'mutable_declaration',
        identifier: 'x'
      });
    });

    it('parses mutable variable delcarations', () => {
      const parser = new Parser('let x = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{ type: 'number_literal', value: '1' }]
      });
    });
  });

  describe('object literals', () => {
    it('parses empty object literals', () => {
      const parser = new Parser('const obj = {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal'
        }]
      });
    });

    it('parses object literals with single key/val', () => {
      const parser = new Parser('const obj = { x: 1 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', value: '1' }]
          }]
        }]
      });
    });

    it('parses object literals with multiple key/vals', () => {
      const parser = new Parser('const obj = { x: 1, y: 2 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', value: '1' }]
          }, {
            type: 'object_key',
            key: 'y',
            value: [{ type: 'number_literal', value: '2' }]
          }]
        }]
      });
    });

    it('parses nested object literals', () => {
      const parser = new Parser('const obj = { x: 1, y : { z: 2 } }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', value: '1' }]
          }, {
            type: 'object_key',
            key: 'y',
            value: [{
              type: 'object_literal',
              member: [{
                type: 'object_key',
                key: 'z',
                value: [{ type: 'number_literal', value: '2' }]
              }]
            }]
          }]
        }]
      });
    });
  });

  describe('object accessors', () => {
    it('parses key/val accessors', () => {
      const parser = new Parser('obj.key = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'bin_op',
        operator: '=',
        left: [{
          type: 'object_reference',
          name: 'obj',
          path: 'key'
        }],
        right: [{
          type: 'number_literal',
          value: '1'
        }]
      });
    });
  });

  describe('function declarations', () => {
    it('returns null for invalid declarations', () => {
      const parser = new Parser('function function() {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBe(null);
    });

    it('parses functions with no arguments', () => {
      const parser = new Parser('function sayHello() {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'function',
        name: 'sayHello',
        args: []
      });
    });

    it('parses functions with a single argument', () => {
      const parser = new Parser('function incr(x) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'function',
        name: 'incr',
        args: ['x']
      });
    });

    it('parses functions with multiple arguments', () => {
      const parser = new Parser('function add(x, y) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'function',
        name: 'add',
        args: ['x', 'y']
      });
    });

    it('parses functions with a single body expression', () => {
      const parser = new Parser('function add(x, y) { return x + y }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        name: 'add',
        args: ['x', 'y'],
        body: [{
          type: 'return_statement',
          expression: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'identifier',
              identifier: 'x'
            }],
            right: [{
              type: 'identifier',
              identifier: 'y'
            }]
          }]
        }]
      });
    });

    it('parses functions with a multiple body expression', () => {
      const parser = new Parser(`
        function add(x, y) {
          const a = 1;
          return a;
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        name: 'add',
        args: ['x', 'y'],
        body: [
          {
            type: 'immutable_declaration',
            identifier: 'a',
            expression: [{
              type: 'number_literal',
              value: '1'
            }]
          },
          {
            type: 'return_statement',
            expression: [{
              type: 'identifier',
              identifier: 'a'
            }]
          }
        ]
      });
    });
  });

  describe('function invocations', () => {
    it('parses invocations with no arguments', () => {
      const parser = new Parser('random()');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'invocation',
        name: 'random',
        args: []
      });
    });

    it('parses invocations with one argument', () => {
      const parser = new Parser('incr(1)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'invocation',
        name: 'incr',
        args: ['1']
      });
    });

    it('parses invocations with multiple', () => {
      const parser = new Parser('add(1, 2)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'invocation',
        name: 'add',
        args: ['1', '2']
      });
    });
  });

  describe('return statements', () => {
    it('parses the expression to return', () => {
      const parser = new Parser('return x');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'return_statement',
        expression: [{
          identifier: 'x',
          type: 'identifier'
        }]
      });
    });
  });

  describe('class declarations', () => {
    it('parses class definitions', () => {
      const parser = new Parser('class Calculator {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null
      });
    });

    it('parses class definitions with super class', () => {
      const parser = new Parser('class Calculator extends Abacus {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: 'Abacus'
      });
    });

    it('parses class definitions with a method in the body', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'turnOn',
          args: []
        }]
      });
    });

    it('parses class definitions with multiple methods in the body', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn () {}
          turnOff () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'turnOn',
          args: []
        }, {
          type: 'method',
          name: 'turnOff',
          args: []
        }]
      });
    });

    it('parses class definitions with methods and arguments in the body', () => {
      const parser = new Parser(`
        class Calculator {
          add (x, y) {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'add',
          args: ['x', 'y']
        }]
      });
    });

    it('parses class definitions with methods bodies', () => {
      const parser = new Parser(`
        class Calculator {
          add (x, y) {
            return x + y;
          }
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'add',
          args: ['x', 'y'],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'bin_op',
              operator: '+',
              left: [{
                type: 'identifier',
                identifier: 'x'
              }],
              right: [{
                type: 'identifier',
                identifier: 'y'
              }]
            }]
          }]
        }]
      });
    });

    it('parses class definitions with constructor method', () => {
      const parser = new Parser(`
        class Calculator {
          constructor () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'constructor',
          name: 'constructor',
          args: []
        }]
      });
    });
  });
});
