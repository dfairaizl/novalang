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
      const parser = new Parser();
      parser.parse('const x = 1');

      expect(parser.parsePrimaryExpression()).toBeTruthy();
      expect(parser.parsePrimaryExpression()).not.toBeDefined();
    });
  });

  describe('multile statements', () => {
    it('one per line', () => {
      const parser = new Parser();
      parser.parse(`
        const x = 1
        const y = 2
      `);

      // there has to be a bretter way to do this
      const expr1 = parser.parsePrimaryExpression();

      expect(expr1).toHaveProperty('mutable', false);
      expect(expr1).toHaveProperty('varName', 'x');
      expect(expr1).toHaveProperty('source', new NumberNode('1'));

      const expr2 = parser.parsePrimaryExpression();

      expect(expr2).toHaveProperty('mutable', false);
      expect(expr2).toHaveProperty('varName', 'y');
      expect(expr2).toHaveProperty('source', new NumberNode('2'));

      // expect().toEqual(new VariableNode(
      //   false,
      //   'x',
      //   new NumberNode('1')
      // ));
      //
      // expect(parser.parsePrimaryExpression()).toEqual(new VariableNode(
      //   false,
      //   'y',
      //   new NumberNode('2')
      // ));
    });

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

      expect(parser.parsePrimaryExpression()).toEqual(new FunctionNode(
        'sayHello',
        [],
        null
      ));
    });

    it('parses functions with a single argument', () => {
      const parser = new Parser();
      parser.parse('function incr(x) {}');

      expect(parser.parsePrimaryExpression()).toEqual(new FunctionNode(
        'incr',
        ['x'],
        null
      ));
    });

    it('parses functions with multiple arguments', () => {
      const parser = new Parser();
      parser.parse('function add(x, y) {}');

      expect(parser.parsePrimaryExpression()).toEqual(new FunctionNode(
        'add',
        ['x', 'y'],
        null
      ));
    });
  });

  describe('function invocations', () => {
    it('parses invocations with no arguments', () => {
      const parser = new Parser();
      parser.parse('random()');

      expect(parser.parsePrimaryExpression()).toEqual(new InvocationNode('random', []));
    });

    it('parses invocations with one argument', () => {
      const parser = new Parser();
      parser.parse('incr(1)');

      expect(parser.parsePrimaryExpression()).toEqual(new InvocationNode('incr', ['1']));
    });

    it('parses invocations with multiple', () => {
      const parser = new Parser();
      parser.parse('add(1, 2)');

      expect(parser.parsePrimaryExpression()).toEqual(new InvocationNode('add', ['1', '2']));
    });
  });

  describe('return statements', () => {
    it('parses the expression to return', () => {
      const parser = new Parser();
      parser.parse('return x');

      expect(parser.parsePrimaryExpression()).toEqual('x');
    });
  });

  describe('closures', () => {
    it('creates a global closure to hold variables', () => {
      const parser = new Parser();
      parser.parse('const x = 1; const y = x');

      const xVar = parser.parsePrimaryExpression(); // const x = 1
      const yVar = parser.parsePrimaryExpression();

      const closure = yVar.scope().filterFor(VariableNode);

      expect(closure).toEqual([yVar, xVar]);
    });
  });
});
