/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('boolean literals', () => {
    it('parses `true`', () => {
      const parser = new Parser('true');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'boolean_literal',
        kind: 'bool',
        value: 'true'
      });
    });

    it('parses `false`', () => {
      const parser = new Parser('false');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'boolean_literal',
        kind: 'bool',
        value: 'false'
      });
    });
  });

  describe('number literals', () => {
    it('parses integer numbers', () => {
      const parser = new Parser('42');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'number_literal',
        kind: 'Int',
        value: '42'
      });
    });

    it('parses floating point numbers', () => {
      const parser = new Parser('4.2');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'number_literal',
        kind: 'Float',
        value: '4.2'
      });
    });
  });

  describe('string literals', () => {
    it('parses empty stirng literals', () => {
      const parser = new Parser('\'\'');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'string_literal',
        kind: 'String',
        value: ''
      });
    });

    it('parses stirng literals', () => {
      const parser = new Parser("'hello world'");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'string_literal',
        kind: 'String',
        value: 'hello world'
      });
    });
  });
});
