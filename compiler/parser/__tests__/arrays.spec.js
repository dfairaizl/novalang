/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('array literals', () => {
    it('parses empty array type', () => {
      const parser = new Parser('let x: [Int]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        kind: '[Int]'
      });
    });

    it('parses empty array literals', () => {
      const parser = new Parser('let x = []');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal'
        }]
      });
    });

    it('parses empty array literals with number literals', () => {
      const parser = new Parser('let x = [1]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal',
          members: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }]
        }]
      });
    });

    it('parses empty array literals with string literals', () => {
      const parser = new Parser("let x = ['hello']");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal',
          members: [{
            type: 'string_literal',
            kind: 'String',
            value: 'hello'
          }]
        }]
      });
    });

    it('parses empty array literals with object literals', () => {
      const parser = new Parser('let x = [{}]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal',
          members: [{
            type: 'object_literal'
          }]
        }]
      });
    });

    it('parses empty array literals with identifiers', () => {
      const parser = new Parser('let x = [y]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal',
          members: [{
            type: 'variable_reference',
            identifier: 'y'
          }]
        }]
      });
    });

    it('parses empty array literals with function invocations', () => {
      const parser = new Parser('let x = [random()]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal',
          members: [{
            type: 'invocation',
            identifier: 'random'
          }]
        }]
      });
    });

    it('parses empty array literals with multiple members', () => {
      const parser = new Parser('let x = [1, 2]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_literal',
          members: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }, {
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }]
        }]
      });
    });
  });

  describe('array accessors', () => {
    it('parses array indexing in assignments', () => {
      const parser = new Parser('fib[0] = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'assignment',
        operator: '=',
        left: [{
          type: 'array_reference',
          identifier: 'fib',
          index_expression: [{
            type: 'number_literal',
            kind: 'Int',
            value: '0'
          }]
        }],
        right: [{
          type: 'number_literal',
          kind: 'Int',
          value: '1'
        }]
      });
    });

    it('parses array index references with literals', () => {
      const parser = new Parser('const x = fib[0]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_reference',
          identifier: 'fib',
          index_expression: [{
            type: 'number_literal',
            kind: 'Int',
            value: '0'
          }]
        }]
      });
    });

    it('parses array index references with variables', () => {
      const parser = new Parser('const x = fib[y]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_reference',
          identifier: 'fib',
          index_expression: [{
            type: 'variable_reference',
            identifier: 'y'
          }]
        }]
      });
    });

    it('parses array index references with expressions', () => {
      const parser = new Parser('const x = fib[1 + 1]');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'array_reference',
          identifier: 'fib',
          index_expression: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }]
        }]
      });
    });
  });
});
