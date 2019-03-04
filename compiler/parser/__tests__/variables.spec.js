/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('variable declarations', () => {
    it('parses immutable variables with number literal assignment', () => {
      const parser = new Parser('const x = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        identifier: 'x'
      });
    });

    it('parses immutable variables with type annotation', () => {
      const parser = new Parser('const x: Int = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'immutable_declaration',
        kind: 'Int',
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
        expression: [{
          type: 'invocation',
          name: 'sqrt',
          arguments: [{
            type: 'number_literal',
            kind: 'Int',
            value: '9'
          }]
        }]
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
            kind: 'Int',
            value: '1'
          }],
          right: [{
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }]
        }]
      });
    });

    it('parses mutable variable delcarations with no assignment', () => {
      const parser = new Parser('let x: Int');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'mutable_declaration',
        kind: 'Int',
        identifier: 'x'
      });
    });

    it('parses mutable variable delcarations', () => {
      const parser = new Parser('let x = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'mutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'number_literal',
          kind: 'Int',
          value: '1'
        }]
      });
    });
  });
});
