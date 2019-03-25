/* global describe, it, expect */

const Parser = require('..');

describe('Parser', () => {
  describe('if conditionals', () => {
    it('parses simple `if` statements', () => {
      const parser = new Parser('if (1) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }]
        }]
      });
    });

    it('parses simple `if` statements with body', () => {
      const parser = new Parser('if (1) { return x }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'variable_reference',
              identifier: 'x'
            }]
          }]
        }]
      });
    });

    it('parses simple `if` statements with multiple body expressions', () => {
      const parser = new Parser('if (1) { let y = 1; return y; }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'mutable_declaration',
            identifier: 'y',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }, {
            type: 'return_statement',
            expression: [{
              type: 'variable_reference',
              identifier: 'y'
            }]
          }]
        }]
      });
    });

    it('parses `if` statements with greater than comparisons in test', () => {
      const parser = new Parser('if (1 > 0) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'bin_op',
            operator: '>',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '0'
            }]
          }]
        }]
      });
    });

    it('parses `if` statements with less than comparisons in test', () => {
      const parser = new Parser('if (1 < 0) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'bin_op',
            operator: '<',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '0'
            }]
          }]
        }]
      });
    });

    it('parses `if` statements with greater than equal to comparisons in test', () => {
      const parser = new Parser('if (1 >= 0) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'bin_op',
            operator: '>=',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '0'
            }]
          }]
        }]
      });
    });

    it('parses `if` statements with less than equal to comparisons in test', () => {
      const parser = new Parser('if (1 <= 0) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'bin_op',
            operator: '<=',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '0'
            }]
          }]
        }]
      });
    });

    it('parses `if` statements with equality comparisons in test', () => {
      const parser = new Parser('if (1 == 0) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'bin_op',
            operator: '==',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '0'
            }]
          }]
        }]
      });
    });

    it('parses `if` statements with inequality comparisons in test', () => {
      const parser = new Parser('if (1 != 0) {}');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'bin_op',
            operator: '!=',
            left: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }],
            right: [{
              type: 'number_literal',
              kind: 'Int',
              value: '0'
            }]
          }]
        }]
      });
    });
  });

  describe('if/else statements', () => {
    it('parses simeple if/else conditions', () => {
      const parser = new Parser('if (1) { 1 } else { 2 }');

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }]
        }],
        else: [{
          type: 'else_expression',
          body: [{
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }]
        }]
      });
    });

    it('parses if/else with multiple else statements', () => {
      const parser = new Parser(`
        if (1) {
          return 1;
        } else {
          let y = 2;
          return y;
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }]
        }],
        else: [{
          type: 'else_expression',
          body: [{
            type: 'mutable_declaration',
            identifier: 'y',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '2'
            }]
          }, {
            type: 'return_statement',
            expression: [{
              type: 'variable_reference',
              identifier: 'y'
            }]
          }]
        }]
      });
    });
  });

  describe('if/else if statements', () => {
    it('parses simple else if statements', () => {
      const parser = new Parser(`
        if (1) {
          return 1;
        } else if (2) {
          return 2
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }]
        }, {
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '2'
            }]
          }]
        }]
      });
    });

    it('parses multiple else if statements', () => {
      const parser = new Parser(`
        if (1) {
          return 1;
        } else if (2) {
          return 2
        } else if (3) {
          return 3
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }]
        }, {
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '2'
            }]
          }]
        }, {
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '3'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '3'
            }]
          }]
        }]
      });
    });
  });

  describe('if else/if/else statements', () => {
    it('parses simple else if else statements', () => {
      const parser = new Parser(`
        if (1) {
          return 1;
        } else if (2) {
          return 2;
        } else {
          return 3;
        }
      `);

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: 'conditional_branch',
        conditions: [{
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '1'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '1'
            }]
          }]
        }, {
          type: 'if_conditional',
          test: [{
            type: 'number_literal',
            kind: 'Int',
            value: '2'
          }],
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '2'
            }]
          }]
        }],
        else: [{
          type: 'else_expression',
          body: [{
            type: 'return_statement',
            expression: [{
              type: 'number_literal',
              kind: 'Int',
              value: '3'
            }]
          }]
        }]
      });
    });
  });
});
