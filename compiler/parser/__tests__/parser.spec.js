/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('syntax', () => {
    describe('code modules', () => {
      it('creates a new module to hold parsed code', () => {
        const parser = new Parser('const x = 1');

        const nodeGraph = parser.parse();
        expect(nodeGraph.treeFromNode()).toEqual({
          type: 'module',
          sources: [{
            type: 'immutable_declaration',
            identifier: 'x',
            expression: [{ type: 'number_literal', kind: 'Int', value: '1' }]
          }]
        });
      });
    });

    describe('syntax', () => {
      it('throws an error for invalid syntax', () => {
        const parser = new Parser('const x 1');
        expect(() => {
          parser.parsePrimaryExpression();
        }).toThrow();
      });
    });

    describe('end of input', () => {
      it('does not parse after EOF', () => {
        const parser = new Parser('const x = 1');

        expect(parser.parsePrimaryExpression()).toBeTruthy();
        expect(parser.parsePrimaryExpression()).not.toBeDefined();
      });
    });

    describe('multiple statements', () => {
      it('one per line', () => {
        const parser = new Parser(`
          const x = 1
          const y = 2
        `);

        expect(parser.parsePrimaryExpression().attributes).toEqual({
          type: 'immutable_declaration',
          identifier: 'x'
        });

        expect(parser.parsePrimaryExpression().attributes).toEqual({
          type: 'immutable_declaration',
          identifier: 'y'
        });
      });

      it('delimits statements based on semicolons', () => {
        const parser = new Parser('const x = 1; const y = 2');

        expect(parser.parsePrimaryExpression().attributes).toEqual({
          type: 'immutable_declaration',
          identifier: 'x'
        });

        expect(parser.parsePrimaryExpression().attributes).toEqual({
          type: 'immutable_declaration',
          identifier: 'y'
        });
      });

      it('delimits binary expressions between semicolons', () => {
        const parser = new Parser('const x = 1 + 2; const y = 1');

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
    });
  });
});
