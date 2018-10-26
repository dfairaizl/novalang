/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('functions', () => {
    it('parses basic function declarations', () => {
      const parser = new Parser();
      parser.parse('function hello() {}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'hello',
        args: []
      });
    });

    it('parses function declarations with single param', () => {
      const parser = new Parser();
      parser.parse('function hello(name) {}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'hello',
        args: ['name']
      });
    });

    it('parses function declarations with multiple params', () => {
      const parser = new Parser();
      parser.parse('function hello(first, last) {}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'hello',
        args: ['first', 'last']
      });
    });
  });
});
