/* global describe, it, expect */

const Parser = require('.');

describe('Parser', () => {
  describe('end of input', () => {
    it('does not parse after EOF', () => {
      const parser = new Parser();
      parser.parse('const x = 1');

      expect(parser.parsePrimaryExpression()).toBeTruthy();
      expect(parser.parsePrimaryExpression()).not.toBeDefined();
    });
  });

  describe('variable declarations', () => {
    it('parses immutable variables with number literal assignment', () => {
      const parser = new Parser();
      parser.parse('const x = 1');

      expect(parser.parsePrimaryExpression()).toEqual({
        mutable: false,
        identifier: { identifier: 'x' },
        assignmentExpr: { value: '1' }
      });
    });

    it('parses immutable variables with identifier assignment', () => {
      const parser = new Parser();
      parser.parse('const x = y');

      expect(parser.parsePrimaryExpression()).toEqual({
        mutable: false,
        identifier: { identifier: 'x' },
        assignmentExpr: { identifier: 'y' }
      });
    });

    it('parses immutable variables with function invocation assignment', () => {
      const parser = new Parser();
      parser.parse('const x = sqrt(9)');

      expect(parser.parsePrimaryExpression()).toEqual({
        mutable: false,
        identifier: { identifier: 'x' },
        assignmentExpr: { name: 'sqrt', args: ['9'] }
      });
    });

    it('parses immutable variables with binary expression assignment', () => {
      const parser = new Parser();
      parser.parse('const x = 1 + 2');

      expect(parser.parsePrimaryExpression()).toEqual({
        mutable: false,
        identifier: { identifier: 'x' },
        assignmentExpr: {
          left: { value: '1' },
          operator: { value: '+' },
          right: { value: '2' }
        }
      });
    });

    it('parses mutable variable delcarations', () => {
      const parser = new Parser();
      parser.parse('let x = 1');

      expect(parser.parsePrimaryExpression()).toEqual({
        mutable: true,
        identifier: { identifier: 'x' },
        assignmentExpr: { value: '1' }
      });
    });

    it('parses mutable variable delcarations with no assignment', () => {
      const parser = new Parser();
      parser.parse('let x');

      expect(parser.parsePrimaryExpression()).toEqual({
        mutable: true,
        identifier: { identifier: 'x' },
        assignmentExpr: null
      });
    });
  });

  describe('function declarations', () => {
    it('parses functions with no arguments', () => {
      const parser = new Parser();
      parser.parse('function sayHello() {}');

      expect(parser.parsePrimaryExpression()).toEqual({
        name: 'sayHello',
        args: [],
        body: null
      });
    });

    it('parses functions with a single argument', () => {
      const parser = new Parser();
      parser.parse('function incr(x) {}');

      expect(parser.parsePrimaryExpression()).toEqual({
        name: 'incr',
        args: ['x'],
        body: null
      });
    });

    it('parses functions with multiple arguments', () => {
      const parser = new Parser();
      parser.parse('function add(x, y) {}');

      expect(parser.parsePrimaryExpression()).toEqual({
        name: 'add',
        args: ['x', 'y'],
        body: null
      });
    });
  });

  describe('function invocations', () => {
    it('parses invocations with no arguments', () => {
      const parser = new Parser();
      parser.parse('random()');

      expect(parser.parsePrimaryExpression()).toEqual({
        name: 'random',
        args: []
      });
    });

    it('parses invocations with one argument', () => {
      const parser = new Parser();
      parser.parse('incr(1)');

      expect(parser.parsePrimaryExpression()).toEqual({
        name: 'incr',
        args: ['1']
      });
    });

    it('parses invocations with multiple', () => {
      const parser = new Parser();
      parser.parse('add(1, 2)');

      expect(parser.parsePrimaryExpression()).toEqual({
        name: 'add',
        args: ['1', '2']
      });
    });
  });

  describe('return statements', () => {
    it('parses the expression to return', () => {
      const parser = new Parser();
      parser.parse('return x');

      expect(parser.parsePrimaryExpression()).toEqual({
        identifier: 'x'
      });
    });
  });
});
