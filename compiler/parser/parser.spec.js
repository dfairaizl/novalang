/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('Variable declarations', () => {
    it('parses immutable variable delcarations', () => {
      const parser = new Parser();
      parser.parse('const x = 1');

      expect(parser.parseExpression()).toEqual({
        mutable: false,
        identifier: { identifier: 'x' },
        assignmentExpr: { value: '1' }
      });
    });

    it('parses mutable variable delcarations', () => {
      const parser = new Parser();
      parser.parse('let x = 1');

      expect(parser.parseExpression()).toEqual({
        mutable: true,
        identifier: { identifier: 'x' },
        assignmentExpr: { value: '1' }
      });
    });

    it('parses mutable variable delcarations with no assignment', () => {
      const parser = new Parser();
      parser.parse('let x');

      expect(parser.parseExpression()).toEqual({
        mutable: true,
        identifier: { identifier: 'x' },
        assignmentExpr: null
      });
    });
  });
});
