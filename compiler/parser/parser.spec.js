/* global describe, it, expect */

const Parser = require('.');
const {
  NumberNode,
  VariableNode
} = require('../graph/nodes');

describe('Parser', () => {
  describe('end of input', () => {
    it('does not parse after EOF', () => {
      const parser = new Parser();
      parser.parse('const x = 1');

      expect(parser.parsePrimaryExpression()).toBeTruthy();
      expect(parser.parsePrimaryExpression()).not.toBeDefined();
    });
  });

  describe('multile statements', () => {
    it('delimits statements based on semicolons', () => {
      const parser = new Parser();
      parser.parse('const x = 1; const y = 2');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        false,
        'x',
        new NumberNode('1')
      ));

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        false,
        'y',
        new NumberNode('2')
      ));
    });
  });

  describe('variable declarations', () => {
    it('parses immutable variables with number literal assignment', () => {
      const parser = new Parser();
      parser.parse('const x = 1');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        false,
        'x',
        new NumberNode('1')
      ));
    });

    it('parses immutable variables with identifier assignment', () => {
      const parser = new Parser();
      parser.parse('const x = y');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        false,
        'x',
        'y'
      ));
    });

    it('parses immutable variables with function invocation assignment', () => {
      const parser = new Parser();
      parser.parse('const x = sqrt(9)');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        false,
        'x',
        { name: 'sqrt', args: ['9'] }
      ));
    });

    it('parses immutable variables with binary expression assignment', () => {
      const parser = new Parser();
      parser.parse('const x = 1 + 2');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        false,
        'x',
        {
          left: new NumberNode('1'),
          operator: { value: '+' },
          right: new NumberNode('2')
        }
      ));
    });

    it('parses mutable variable delcarations', () => {
      const parser = new Parser();
      parser.parse('let x = 1');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        true,
        'x',
        new NumberNode('1')
      ));
    });

    it('parses mutable variable delcarations with no assignment', () => {
      const parser = new Parser();
      parser.parse('let x');

      expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
        true,
        'x',
        null
      ));
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

      expect(parser.parsePrimaryExpression()).toEqual('x');
    });
  });
});
