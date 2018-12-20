/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('string literals', () => {
    it('parses empty stirng literals', () => {
      const parser = new Parser('const str = \'\'');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'str',
        expression: [{
          type: 'string_literal',
          value: ''
        }]
      });
    });

    it('parses stirng literals', () => {
      const parser = new Parser("const str = 'hello world'");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'str',
        expression: [{
          type: 'string_literal',
          value: 'hello world'
        }]
      });
    });
  });
});
