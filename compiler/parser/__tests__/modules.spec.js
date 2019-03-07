/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('import statements', () => {
    it('parses import statements with a single imported function', () => {
      const parser = new Parser("import func from 'some-module'");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'import_statement',
        name: 'some-module',
        import: [{
          type: 'import_declaration',
          identifier: 'func'
        }]
      });
    });

    it('parses import statements with multiple imported functions', () => {
      const parser = new Parser("import func1, func2 from 'some-module'");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'import_statement',
        name: 'some-module',
        import: [{
          type: 'import_declaration',
          identifier: 'func1'
        }, {
          type: 'import_declaration',
          identifier: 'func2'
        }]
      });
    });
  });
});
