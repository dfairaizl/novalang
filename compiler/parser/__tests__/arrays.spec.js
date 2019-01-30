/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('array literals', () => {
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
            kind: 'int',
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
            kind: 'string',
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
            name: 'random'
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
            kind: 'int',
            value: '1'
          }, {
            type: 'number_literal',
            kind: 'int',
            value: '2'
          }]
        }]
      });
    });
  });

  describe('array accessors', () => {
    it('parses array indexing', () => {
      const parser = new Parser('fib[0] = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'bin_op',
        operator: '=',
        left: [{
          type: 'array_reference',
          name: 'fib',
          index: '0'
        }],
        right: [{
          type: 'number_literal',
          kind: 'int',
          value: '1'
        }]
      });
    });
  });
});
