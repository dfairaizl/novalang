/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('while loops', () => {
    it('parses simple while loops', () => {
      const parser = new Parser('while (true) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'while_loop',
        test: [{
          type: 'boolean_literal',
          value: 'true'
        }]
      });
    });

    it('parses while loops with body expressions', () => {
      const parser = new Parser('while (true) { let x = 0; call(x) }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'while_loop',
        test: [{
          type: 'boolean_literal',
          value: 'true'
        }],
        body: [{
          type: 'mutable_declaration',
          identifier: 'x',
          expression: [{ type: 'number_literal', value: '0' }]
        }, {
          type: 'invocation',
          name: 'call',
          arguments: [{
            type: 'identifier',
            identifier: 'x'
          }]
        }]
      });
    });
  });

  describe('do/while loops', () => {
    it('parses simple do/while loops', () => {
      const parser = new Parser('do {} while (true)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'do_while_loop',
        test: [{
          type: 'boolean_literal',
          value: 'true'
        }]
      });
    });

    it('parses simple do/while loops with body expressions', () => {
      const parser = new Parser('do { let x = 0; call(x) } while (true)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'do_while_loop',
        test: [{
          type: 'boolean_literal',
          value: 'true'
        }],
        body: [{
          type: 'mutable_declaration',
          identifier: 'x',
          expression: [{ type: 'number_literal', value: '0' }]
        }, {
          type: 'invocation',
          name: 'call',
          arguments: [{
            type: 'identifier',
            identifier: 'x'
          }]
        }]
      });
    });
  });
});
