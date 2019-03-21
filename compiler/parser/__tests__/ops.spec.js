/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('function declarations', () => {
    it.only('parses immutable variables with binary expression assignment', () => {
      const parser = new Parser('const x = 3 * 2 + 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'x',
        expression: [{
          type: 'bin_op',
          operator: '+',
          left: [{
            type: 'bin_op',
            operator: '*',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '3'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '2'
            }]
          }],
          right: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }]
        }]
      });
    });
  });
});
