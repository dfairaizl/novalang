/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('require statements', () => {
    it('parses module require expressions', () => {
      const parser = new Parser("require('some-module')");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'require_statement',
        module: [{
          type: 'string_literal',
          value: 'some-module'
        }]
      });
    });

    it('parses relative require expressions', () => {
      const parser = new Parser("require('./local-module')");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'require_statement',
        module: [{
          type: 'string_literal',
          value: './local-module'
        }]
      });
    });
  });
});
