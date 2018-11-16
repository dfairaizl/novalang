/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('expressions', () => {
    it('parses function invocations', () => {
      const parser = new Parser();
      parser.parse('helloWorld()');

      expect(parser.parseBinaryExpression()).toEqual({
        name: 'helloWorld',
        args: []
      });
    });

    describe('simple binary expressions', () => {
      it('parses simple addition', () => {
        const parser = new Parser();
        parser.parse('1+1');

        expect(parser.parseBinaryExpression()).toEqual({
          operator: '+',
          left: '1',
          right: '1'
        });
      });

      it('parses simple subtraction', () => {
        const parser = new Parser();
        parser.parse('1-1');

        expect(parser.parseBinaryExpression()).toEqual({
          operator: '-',
          left: '1',
          right: '1'
        });
      });

      it('parses simple multiplication', () => {
        const parser = new Parser();
        parser.parse('1*1');

        expect(parser.parseBinaryExpression()).toEqual({
          operator: '*',
          left: '1',
          right: '1'
        });
      });

      it('parses simple division', () => {
        const parser = new Parser();
        parser.parse('1/1');

        expect(parser.parseBinaryExpression()).toEqual({
          operator: '/',
          left: '1',
          right: '1'
        });
      });
    });

    describe.only('complex binary expressions', () => {
      it('parses nested addition expressions', () => {
        const parser = new Parser();
        parser.parse('1+(1+3)');

        expect(parser.parseBinaryExpression()).toEqual({
          operator: '+',
          left: '1',
          right: '1'
        });
      });
    });
  });

  describe('function declarations', () => {
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
