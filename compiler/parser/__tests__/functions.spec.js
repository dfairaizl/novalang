/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
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
        name: 'sayHello'
      });
    });

    it('parses functions with a single argument', () => {
      const parser = new Parser('function incr(x) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        name: 'incr',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }]
      });
    });

    it('parses functions with multiple arguments', () => {
      const parser = new Parser('function add(x, y) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        name: 'add',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }, {
          type: 'function_argument',
          identifier: 'y'
        }]
      });
    });

    it('parses functions with a single body expression', () => {
      const parser = new Parser('function add(x, y) { return x + y }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        name: 'add',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }, {
          type: 'function_argument',
          identifier: 'y'
        }],
        body: [{
          type: 'return_statement',
          expression: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'variable_reference',
              identifier: 'x'
            }],
            right: [{
              type: 'variable_reference',
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
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }, {
          type: 'function_argument',
          identifier: 'y'
        }],
        body: [
          {
            type: 'immutable_declaration',
            identifier: 'a',
            expression: [{
              type: 'number_literal',
              kind: 'int',
              value: '1'
            }]
          },
          {
            type: 'return_statement',
            expression: [{
              type: 'variable_reference',
              identifier: 'a'
            }]
          }
        ]
      });
    });
  });

  describe('short-hand syntax (fat-arrow)', () => {
    it('parsers function delcarations', () => {
      const parser = new Parser('() => {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'anonymous_function'
      });
    });

    it('parsers function delcarations with arguments', () => {
      const parser = new Parser('(x) => {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'anonymous_function',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }]
      });
    });

    it('parsers short-hand functions in assignment', () => {
      const parser = new Parser('const f = (x) => {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'f',
        expression: [{
          type: 'anonymous_function',
          arguments: [{
            type: 'function_argument',
            identifier: 'x'
          }]
        }]
      });
    });

    it('parsers short-hand functions as function arguments', () => {
      const parser = new Parser(`
        forEach((x) => {

        })
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        name: 'forEach',
        arguments: [{
          type: 'anonymous_function',
          arguments: [{
            type: 'function_argument',
            identifier: 'x'
          }]
        }]
      });
    });

    it('parsers function delcarations with body', () => {
      const parser = new Parser('(x) => { return x + 1 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'anonymous_function',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }],
        body: [{
          type: 'return_statement',
          expression: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'variable_reference',
              identifier: 'x'
            }],
            right: [{
              type: 'number_literal',
              kind: 'int',
              value: '1'
            }]
          }]
        }]
      });
    });
  });

  describe('function invocations', () => {
    it('parses invocations with no arguments', () => {
      const parser = new Parser('random()');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'invocation',
        name: 'random'
      });
    });

    it('parses invocations with one argument', () => {
      const parser = new Parser('incr(1)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        name: 'incr',
        arguments: [{
          type: 'number_literal',
          kind: 'int',
          value: '1'
        }]
      });
    });

    it('parses invocations with multiple', () => {
      const parser = new Parser('add(1, 2)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        name: 'add',
        arguments: [{
          type: 'number_literal',
          kind: 'int',
          value: '1'
        }, {
          type: 'number_literal',
          kind: 'int',
          value: '2'
        }]
      });
    });

    it('parses invocations with complex arguments', () => {
      const parser = new Parser('assign({ x: 1 })');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        name: 'assign',
        arguments: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', kind: 'int', value: '1' }]
          }]
        }]
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
          type: 'variable_reference',
          identifier: 'x'
        }]
      });
    });
  });
});
