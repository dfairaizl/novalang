/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('class declarations', () => {
    it('parses class definitions', () => {
      const parser = new Parser('class Calculator {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null
      });
    });

    it('parses class definitions with super class', () => {
      const parser = new Parser('class Calculator extends Abacus {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: 'Abacus'
      });
    });

    it('parses class definitions with a method in the body', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'turnOn'
        }]
      });
    });

    it('parses class definitions with multiple methods in the body', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn () {}
          turnOff () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'turnOn'
        }, {
          type: 'method',
          name: 'turnOff'
        }]
      });
    });

    it('parses class definitions with methods and arguments in the body', () => {
      const parser = new Parser(`
        class Calculator {
          add (x, y) {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'add',
          arguments: [{
            type: 'function_argument',
            identifier: 'x'
          }, {
            type: 'function_argument',
            identifier: 'y'
          }]
        }]
      });
    });

    it('parses class definitions with methods bodies', () => {
      const parser = new Parser(`
        class Calculator {
          add (x, y) {
            return x + y;
          }
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'add',
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
        }]
      });
    });

    it('parses class definitions with constructor method', () => {
      const parser = new Parser(`
        class Calculator {
          constructor () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'constructor',
          name: 'constructor'
        }]
      });
    });
  });
});
