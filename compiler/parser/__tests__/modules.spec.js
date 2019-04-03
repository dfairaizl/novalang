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

  describe('export statements', () => {
    it('parses export statements for functions', () => {
      const parser = new Parser('export function addOne(x: Int) -> Int {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'export_statement',
        expression: [{
          type: 'function',
          name: 'addOne',
          kind: 'Int',
          arguments: [{
            type: 'function_argument',
            identifier: 'x',
            kind: 'Int'
          }]
        }]
      });
    });

    it('parses export statements for external functions', () => {
      const parser = new Parser('export external function malloc(buff: sizet) -> void *');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'export_statement',
        expression: [{
          type: 'external_function',
          name: 'malloc',
          kind: {
            type: 'pointer',
            kind: 'void',
            indirection: 1
          },
          arguments: [{
            type: 'function_argument',
            identifier: 'buff',
            kind: 'sizet'
          }]
        }]
      });
    });
  });
});
