/* global describe, it, expect */

const Parser = require('.');
const {
  FunctionNode,
  InvocationNode,
  NumberNode,
  VariableNode
} = require('../graph/nodes');

describe('Parser', () => {
  describe('end of input', () => {
    it('does not parse after EOF', () => {
      const parser = new Parser('const x = 1');
      // parser.parse();

      expect(parser.parsePrimaryExpression()).toBeTruthy();
      expect(parser.parsePrimaryExpression()).not.toBeDefined();
    });
  });

  describe('multile statements', () => {
    it('one per line', () => {
      const parser = new Parser(`
        const x = 1
        const y = 2
      `);

      expect(parser.parsePrimaryExpression()).toMatchObject({
        varName: 'x'
      });

      expect(parser.parsePrimaryExpression()).toMatchObject({
        varName: 'y'
      });
    });

    it('delimits statements based on semicolons', () => {
      const parser = new Parser('const x = 1; const y = 2');

      expect(parser.parsePrimaryExpression()).toMatchObject({
        varName: 'x'
      });

      expect(parser.parsePrimaryExpression()).toMatchObject({
        varName: 'y'
      });
    });
  });

  describe('variable declarations', () => {
    it('parses immutable variables with number literal assignment', () => {
      const parser = new Parser('const x = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(VariableNode);
      expect(parsed).toMatchObject({
        mutable: false,
        varName: 'x',
        source: new NumberNode('1')
      });
    });

    it('parses immutable variables with identifier assignment', () => {
      const parser = new Parser('const x = y');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(VariableNode);
      expect(parsed).toMatchObject({
        mutable: false,
        varName: 'x',
        source: 'y'
      });
    });

    it('parses immutable variables with function invocation assignment', () => {
      const parser = new Parser('const x = sqrt(9)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(VariableNode);
      expect(parsed).toMatchObject({
        mutable: false,
        varName: 'x',
        source: { name: 'sqrt', args: ['9'] }
      });
    });

    it('parses immutable variables with binary expression assignment', () => {
      const parser = new Parser('const x = 1 + 2');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(VariableNode);
      expect(parsed).toMatchObject({
        mutable: false,
        varName: 'x',
        source: {
          left: new NumberNode('1'),
          operator: { value: '+' },
          right: new NumberNode('2')
        }
      });
    });

    it('parses mutable variable delcarations', () => {
      const parser = new Parser('let x = 1');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(VariableNode);
      expect(parsed).toMatchObject({
        mutable: true,
        varName: 'x',
        source: new NumberNode('1')
      });
    });

    it('parses mutable variable delcarations with no assignment', () => {
      const parser = new Parser('let x');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(VariableNode);
      expect(parsed).toMatchObject({
        mutable: true,
        varName: 'x',
        source: null
      });
    });
  });

  describe('function declarations', () => {
    it('parses functions with no arguments', () => {
      const parser = new Parser('function sayHello() {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(FunctionNode);
      expect(parsed).toMatchObject({
        name: 'sayHello',
        args: [],
        body: null
      });
    });

    it('parses functions with a single argument', () => {
      const parser = new Parser('function incr(x) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(FunctionNode);
      expect(parsed).toMatchObject({
        name: 'incr',
        args: ['x'],
        body: null
      });
    });

    it('parses functions with multiple arguments', () => {
      const parser = new Parser('function add(x, y) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(FunctionNode);
      expect(parsed).toMatchObject({
        name: 'add',
        args: ['x', 'y'],
        body: null
      });
    });
  });

  describe('function invocations', () => {
    it('parses invocations with no arguments', () => {
      const parser = new Parser('random()');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(InvocationNode);
      expect(parsed).toMatchObject({
        name: 'random',
        args: []
      });
    });

    it('parses invocations with one argument', () => {
      const parser = new Parser('incr(1)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(InvocationNode);
      expect(parsed).toMatchObject({
        name: 'incr',
        args: ['1']
      });
    });

    it('parses invocations with multiple', () => {
      const parser = new Parser('add(1, 2)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBeInstanceOf(InvocationNode);
      expect(parsed).toMatchObject({
        name: 'add',
        args: ['1', '2']
      });
    });
  });

  describe('return statements', () => {
    it('parses the expression to return', () => {
      const parser = new Parser('return x');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toEqual('x');
    });
  });
});
