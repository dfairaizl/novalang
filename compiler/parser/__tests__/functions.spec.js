/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('function declarations', () => {
    it('returns null for invalid declarations', () => {
      const parser = new Parser('function function() {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBe(null);
    });

    it('parses functions with no arguments', () => {
      const parser = new Parser('function sayHello() {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'function',
        identifier: 'sayHello'
      });
    });

    it('parses functions with a single argument', () => {
      const parser = new Parser('function incr(x) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        identifier: 'incr',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }]
      });
    });

    it('parses functions with multiple arguments', () => {
      const parser = new Parser('function add(x, y) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        identifier: 'add',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }, {
          type: 'function_argument',
          identifier: 'y'
        }]
      });
    });

    it('parses functions with a single body expression', () => {
      const parser = new Parser('function add(x, y) { return x + y }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        identifier: 'add',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }, {
          type: 'function_argument',
          identifier: 'y'
        }],
        body: [{
          type: 'return_statement',
          expression: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'variable_reference',
              identifier: 'x'
            }],
            right: [{
              type: 'variable_reference',
              identifier: 'y'
            }]
          }]
        }]
      });
    });

    it('parses functions with a multiple body expression', () => {
      const parser = new Parser(`
        function add(x, y) {
          const a = 1;
          return a;
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'function',
        identifier: 'add',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }, {
          type: 'function_argument',
          identifier: 'y'
        }],
        body: [
          {
            type: 'immutable_declaration',
            identifier: 'a',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          },
          {
            type: 'return_statement',
            expression: [{
              type: 'variable_reference',
              identifier: 'a'
            }]
          }
        ]
      });
    });
  });

  describe('return types', () => {
    it('parses the kind of a function based on the annotation', () => {
      const parser = new Parser('function incr(x) -> Int {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'function',
        identifier: 'incr',
        kind: 'Int'
      });
    });
  });

  describe('short-hand syntax (fat-arrow)', () => {
    it('parsers function delcarations', () => {
      const parser = new Parser('() => {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'anonymous_function'
      });
    });

    it('parsers function delcarations with arguments', () => {
      const parser = new Parser('(x) => {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'anonymous_function',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }]
      });
    });

    it('parsers short-hand functions in assignment', () => {
      const parser = new Parser('const f = (x) => {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'f',
        expression: [{
          type: 'anonymous_function',
          arguments: [{
            type: 'function_argument',
            identifier: 'x'
          }]
        }]
      });
    });

    it('parsers short-hand functions as function arguments', () => {
      const parser = new Parser(`
        forEach((x) => {

        })
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        identifier: 'forEach',
        arguments: [{
          type: 'anonymous_function',
          arguments: [{
            type: 'function_argument',
            identifier: 'x'
          }]
        }]
      });
    });

    it('parsers function delcarations with body', () => {
      const parser = new Parser('(x) => { return x + 1 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'anonymous_function',
        arguments: [{
          type: 'function_argument',
          identifier: 'x'
        }],
        body: [{
          type: 'return_statement',
          expression: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'variable_reference',
              identifier: 'x'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }]
        }]
      });
    });
  });

  describe('function invocations', () => {
    it('parses invocations with no arguments', () => {
      const parser = new Parser('random()');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'invocation',
        identifier: 'random'
      });
    });

    it('parses invocations with one argument', () => {
      const parser = new Parser('incr(1)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        identifier: 'incr',
        arguments: [{
          type: 'number_literal',
          kind: 'Int',
          value: '1'
        }]
      });
    });

    it('parses invocations with multiple', () => {
      const parser = new Parser('add(1, 2)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        identifier: 'add',
        arguments: [{
          type: 'number_literal',
          kind: 'Int',
          value: '1'
        }, {
          type: 'number_literal',
          kind: 'Int',
          value: '2'
        }]
      });
    });

    it('parses invocations with complex arguments', () => {
      const parser = new Parser('assign({ x: 1 })');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        identifier: 'assign',
        arguments: [{
          type: 'object_literal',
          member: [{
            type: 'object_key',
            key: 'x',
            value: [{ type: 'number_literal', kind: 'Int', value: '1' }]
          }]
        }]
      });
    });

    it('parses invocations with binop expressions', () => {
      const parser = new Parser('fib(1 + 1)');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'invocation',
        identifier: 'fib',
        arguments: [{
          type: 'bin_op',
          operator: '+',
          left: [{
            type: 'number_literal',
            value: '1',
            kind: 'Int'
          }],
          right: [{
            type: 'number_literal',
            value: '1',
            kind: 'Int'
          }]
        }]
      });
    });
  });

  describe('return statements', () => {
    it('parses the expression to return', () => {
      const parser = new Parser('return x');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'return_statement',
        expression: [{
          type: 'variable_reference',
          identifier: 'x'
        }]
      });
    });
  });

  describe('external functions', () => {
    it('parses external functions definitions', () => {
      const parser = new Parser('external function sin(x: Int) -> Int');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'external_function',
        identifier: 'sin',
        kind: 'Int',
        arguments: [{
          type: 'function_argument',
          identifier: 'x',
          kind: 'Int'
        }]
      });
    });

    it('parses external functions with C-style argument pointers', () => {
      const parser = new Parser('external function printf(format: char *, arg: Int) -> Int');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'external_function',
        identifier: 'printf',
        kind: 'Int',
        arguments: [{
          type: 'function_argument',
          identifier: 'format',
          kind: {
            type: 'pointer',
            kind: 'char',
            indirection: 1
          }
        }, {
          type: 'function_argument',
          identifier: 'arg',
          kind: 'Int'
        }]
      });
    });

    it('parses external functions with C-style argument pointers to pointers', () => {
      const parser = new Parser('external function getError(error: char**) -> Void');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'external_function',
        identifier: 'getError',
        kind: 'Void',
        arguments: [{
          type: 'function_argument',
          identifier: 'error',
          kind: {
            type: 'pointer',
            kind: 'char',
            indirection: 2
          }
        }]
      });
    });

    it('parses external functions with multiple C-style argument pointers', () => {
      const parser = new Parser('external function printf(format: char *, args: int *) -> Int');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'external_function',
        identifier: 'printf',
        kind: 'Int',
        arguments: [{
          type: 'function_argument',
          identifier: 'format',
          kind: {
            type: 'pointer',
            kind: 'char',
            indirection: 1
          }
        }, {
          type: 'function_argument',
          identifier: 'args',
          kind: {
            type: 'pointer',
            kind: 'int',
            indirection: 1
          }
        }]
      });
    });

    it('parses external functions with variadic arguments', () => {
      const parser = new Parser('external function printf(format: char *, els: ...) -> Int');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'external_function',
        identifier: 'printf',
        kind: 'Int',
        arguments: [{
          type: 'function_argument',
          identifier: 'format',
          kind: {
            type: 'pointer',
            kind: 'char',
            indirection: 1
          }
        }, {
          type: 'function_argument',
          identifier: 'els',
          kind: 'variadic'
        }]
      });
    });

    it('parses external functions with C-style return type', () => {
      const parser = new Parser('external function malloc(buff: sizet) -> void *');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'external_function',
        identifier: 'malloc',
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
      });
    });

    it('fails to parse external functions with non-typed args', () => {
      const parser = new Parser('external function malloc(buff)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBe(null);
    });

    it('fails to parse external functions with no return type', () => {
      const parser = new Parser('external function malloc(buff: sizet)');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBe(null);
    });

    it('fails to parse external functions with a body defined', () => {
      const parser = new Parser('external function free(mem: sizet *) -> void {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed).toBe(null);
    });
  });
});
