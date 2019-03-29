/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('class declarations', () => {
    it('parses class definitions', () => {
      const parser = new Parser('class Calculator {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
        identifier: 'Calculator',
        super_class: null
      });
    });

    it('parses class definitions with super class', () => {
      const parser = new Parser('class Calculator extends Abacus {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parsed.attributes).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
        identifier: 'Calculator',
        super_class: 'Abacus'
      });
    });
  });

  describe('class constructor', () => {
    it('parses class definitions with constructor method', () => {
      const parser = new Parser(`
        class Calculator {
          constructor () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'constructor',
          name: 'constructor'
        }]
      });
    });
  });

  describe('class methods', () => {
    it('parses class definitions with a method in the body', () => {
      const parser = new Parser(`
        class Calculator {
          turnOn () {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
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
        kind: 'Calculator',
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
          add (x: Int, y: Int) {}
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'add',
          arguments: [{
            type: 'function_argument',
            kind: 'Int',
            identifier: 'x'
          }, {
            type: 'function_argument',
            kind: 'Int',
            identifier: 'y'
          }]
        }]
      });
    });

    it('parses class definitions with methods bodies', () => {
      const parser = new Parser(`
        class Calculator {
          add (x: Int, y: Int) -> Int {
            return x + y;
          }
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'method',
          name: 'add',
          kind: 'Int',
          arguments: [{
            type: 'function_argument',
            kind: 'Int',
            identifier: 'x'
          }, {
            type: 'function_argument',
            kind: 'Int',
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
  });

  describe('instance variables', () => {
    it('parses references to `this`', () => {
      const parser = new Parser(`
        class Calculator {
          constructor () {
            this.on = true;
          }
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        kind: 'Calculator',
        identifier: 'Calculator',
        super_class: null,
        body: [{
          type: 'constructor',
          name: 'constructor',
          body: [{
            type: 'assignment',
            operator: '=',
            left: [{
              type: 'instance_reference',
              key_expression: [{
                type: 'key_reference',
                identifier: 'on'
              }]
            }],
            right: [{
              type: 'boolean_literal',
              kind: 'Boolean',
              value: 'true'
            }]
          }]
        }]
      });
    });

    it('parses `this` in expressions', () => {
      const parser = new Parser(`
        class Calculator {
          constructor () {
            const x = this.getX()
          }
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        kind: 'Calculator',
        super_class: null,
        body: [{
          type: 'constructor',
          name: 'constructor',
          body: [{
            type: 'immutable_declaration',
            identifier: 'x',
            expression: [{
              type: 'instance_reference',
              key_expression: [{
                type: 'invocation',
                name: 'getX'
              }]
            }]
          }]
        }]
      });
    });

    it('parses `this` in binop expressions', () => {
      const parser = new Parser(`
        class Calculator {
          constructor () {
            this.x + 1;
          }
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'class_definition',
        identifier: 'Calculator',
        kind: 'Calculator',
        super_class: null,
        body: [{
          type: 'constructor',
          name: 'constructor',
          body: [{
            type: 'bin_op',
            operator: '+',
            left: [{
              type: 'instance_reference',
              key_expression: [{
                type: 'key_reference',
                identifier: 'x'
              }]
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

  describe('instance construction', () => {
    it('instances can be created', () => {
      const parser = new Parser(`
        class Calculator {}
        const c = new Calculator();
      `);

      parser.parsePrimaryExpression(); // class definitiopn
      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'c',
        expression: [{
          type: 'instantiation',
          class: 'Calculator'
        }]
      });
    });

    it('instances can be created with arguments', () => {
      const parser = new Parser(`
        class Generator {}
        const c = new Generator(1, 2);
      `);

      parser.parsePrimaryExpression(); // class definitiopn
      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'immutable_declaration',
        identifier: 'c',
        expression: [{
          type: 'instantiation',
          class: 'Generator',
          arguments: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }, {
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }]
        }]
      });
    });
  });
});
