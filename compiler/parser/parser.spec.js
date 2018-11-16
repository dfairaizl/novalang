/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('atomic expressions', () => {
    it('parses identifiers', () => {
      const parser = new Parser();
      parser.parse('x');

      expect(parser.parseAtomic()).toEqual({
        identifier: 'x'
      });
    });

    it('parses integer literals', () => {
      const parser = new Parser();
      parser.parse('1');

      expect(parser.parseAtomic()).toEqual({
        value: '1'
      });
    });

    it('parses floating point literals', () => {
      const parser = new Parser();
      parser.parse('3.14');

      expect(parser.parseAtomic()).toEqual({
        value: '3.14'
      });
    });
  });

  describe('binary operations', () => {
    it('parses basic assignment expressions', () => {
      const parser = new Parser();
      parser.parse('x = 1');

      expect(parser.parseBinary()).toEqual({
        left: { identifier: 'x' },
        operator: { value: '=' },
        right: { value: '1' }
      });
    });

    it('parses complex assignment expressions', () => {
      const parser = new Parser();
      parser.parse('x = 1 + 1');

      expect(parser.parseBinary()).toEqual({
        left: { identifier: 'x' },
        operator: { value: '=' },
        right: {
          left: { value: '1' },
          operator: { value: '+' },
          right: { value: '1' }
        }
      });
    });

    it('parses complex operations', () => {
      const parser = new Parser();
      parser.parse('x = 2 + (1 + 1)');

      expect(parser.parseBinary()).toEqual({
        left: { identifier: 'x' },
        operator: { value: '=' },
        right: {
          left: { value: '2' },
          operator: { value: '+' },
          right: {
            left: { value: '1' },
            operator: { value: '+' },
            right: { value: '1' }
          }
        }
      });
    });
  });

  describe('paren expressions', () => {
    it('parses expressions wrapped in parens', () => {
      const parser = new Parser();
      parser.parse('(x + 1)');

      expect(parser.parseParen()).toEqual({
        left: { identifier: 'x' },
        operator: { value: '+' },
        right: { value: '1' }
      });
    });
  });

  describe('invocation expressions', () => {
    it('parses function invocations with no parameters', () => {
      const parser = new Parser();
      parser.parse('helloWorld()');

      expect(parser.parseInvocation()).toEqual({
        name: 'helloWorld',
        args: []
      });
    });

    it('parses function invocations with a single paramater', () => {
      const parser = new Parser();
      parser.parse('incr(1)');

      expect(parser.parseInvocation()).toEqual({
        name: 'incr',
        args: ['1']
      });
    });

    it('parses function invocations with multiple parameters', () => {
      const parser = new Parser();
      parser.parse('add(1, 2)');

      expect(parser.parseInvocation()).toEqual({
        name: 'add',
        args: ['1', '2']
      });
    });
  });

  describe('function declarations', () => {
    it('parses basic function declarations', () => {
      const parser = new Parser();
      parser.parse('function hello() {}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'hello',
        args: [],
        body: null
      });
    });

    it('parses function declarations with single param', () => {
      const parser = new Parser();
      parser.parse('function hello(name) {}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'hello',
        args: ['name'],
        body: null
      });
    });

    it('parses function declarations with multiple params', () => {
      const parser = new Parser();
      parser.parse('function hello(first, last) {}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'hello',
        args: ['first', 'last'],
        body: null
      });
    });

    it('parses function declarations with binary operations in body', () => {
      const parser = new Parser();
      parser.parse('function incr(x) { x + 1}');

      expect(parser.parseFunctionDeclaration()).toEqual({
        name: 'incr',
        args: ['x'],
        body: {
          left: { identifier: 'x' },
          operator: { value: '+' },
          right: { value: '1' }
        }
      });
    });
  });
});
