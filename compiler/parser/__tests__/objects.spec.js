/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('object literals', () => {
    it('parses empty object literals', () => {
      const parser = new Parser('const obj = {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal'
        }]
      });
    });

    it('parses object literals with single key/val', () => {
      const parser = new Parser('const obj = { x: 1 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', kind: 'int', value: '1' }]
          }]
        }]
      });
    });

    it('parses object literals with multiple key/vals', () => {
      const parser = new Parser('const obj = { x: 1, y: 2 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', kind: 'int', value: '1' }]
          }, {
            type: 'object_key',
            key: 'y',
            value: [{ type: 'number_literal', kind: 'int', value: '2' }]
          }]
        }]
      });
    });

    it('parses nested object literals', () => {
      const parser = new Parser('const obj = { x: 1, y : { z: 2 } }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'obj',
        expression: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', kind: 'int', value: '1' }]
          }, {
            type: 'object_key',
            key: 'y',
            value: [{
              type: 'object_literal',
              member: [{
                type: 'object_key',
                key: 'z',
                value: [{ type: 'number_literal', kind: 'int', value: '2' }]
              }]
            }]
          }]
        }]
      });
    });
  });

  describe('object accessors', () => {
    it('parses key/val expressions with dot notation', () => {
      const parser = new Parser('obj.key = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'assignment',
        operator: '=',
        left: [{
          type: 'object_reference',
          identifier: 'obj',
          key_expression: [{
            type: 'key_reference', identifier: 'key'
          }]
        }],
        right: [{ type: 'number_literal', kind: 'int', value: '1' }]
      });
    });

    it('parses dep key/val expressions with dot notation', () => {
      const parser = new Parser('obj.key.foo = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'assignment',
        operator: '=',
        left: [{
          type: 'object_reference',
          identifier: 'obj',
          key_expression: [{
            type: 'object_reference',
            identifier: 'key',
            key_expression: [{
              type: 'key_reference', identifier: 'foo'
            }]
          }]
        }],
        right: [{ type: 'number_literal', kind: 'int', value: '1' }]
      });
    });

    it('parses key/val invocations with dot notation', () => {
      const parser = new Parser('obj.key()');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'object_reference',
        identifier: 'obj',
        key_expression: [{
          type: 'invocation',
          name: 'key'
        }]
      });
    });
  });
});
