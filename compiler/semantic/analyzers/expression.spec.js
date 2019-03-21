/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  ReassignImmutableError
} = require('../errors');

describe('Expression Analyzer', () => {
  describe('value assignments', () => {
    it('checks for assignments to immnutable variables', () => {
      const parser = new Parser(`const x = 1; x = 2;`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).toThrowError(ReassignImmutableError);
    });

    it('checks for assignments to mutable variables', () => {
      const parser = new Parser(`let x = 1; x = 2;`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(ReassignImmutableError);
    });
  });

  describe('op precedence', () => {
    it('parses immutable variables with binary expression assignment', () => {
      const parser = new Parser('const x = 1 + 2 * 3');

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
            type: 'bin_op',
            operator: '*',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '2'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '3'
            }]
          }]
        }]
      });
    });
  });
});
