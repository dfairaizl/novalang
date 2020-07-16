/* global describe, it, expect */

const Parser = require("..");

describe("Parser", () => {
  describe("arithmetic expressions", () => {
    it("parses the addition operator", () => {
      const parser = new Parser("7 + 3");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: "bin_op",
        operator: "+",
        left: [
          {
            type: "number_literal",
            kind: "Int",
            value: "7"
          }
        ],
        right: [
          {
            type: "number_literal",
            kind: "Int",
            value: "3"
          }
        ]
      });
    });

    it("parses the subtraction operator", () => {
      const parser = new Parser("1 - 3");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: "bin_op",
        operator: "-",
        left: [
          {
            type: "number_literal",
            kind: "Int",
            value: "1"
          }
        ],
        right: [
          {
            type: "number_literal",
            kind: "Int",
            value: "3"
          }
        ]
      });
    });

    it("parses the multiplication operator", () => {
      const parser = new Parser("12 * 4");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: "bin_op",
        operator: "*",
        left: [
          {
            type: "number_literal",
            kind: "Int",
            value: "12"
          }
        ],
        right: [
          {
            type: "number_literal",
            kind: "Int",
            value: "4"
          }
        ]
      });
    });

    it("parses the division operator", () => {
      const parser = new Parser("16 / 2");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: "bin_op",
        operator: "/",
        left: [
          {
            type: "number_literal",
            kind: "Int",
            value: "16"
          }
        ],
        right: [
          {
            type: "number_literal",
            kind: "Int",
            value: "2"
          }
        ]
      });
    });

    it("parses the modulo operator", () => {
      const parser = new Parser("14 % 8");

      const parsed = parser.parsePrimaryExpression();

      expect(parser.toAST(parsed)).toEqual({
        type: "bin_op",
        operator: "%",
        left: [
          {
            type: "number_literal",
            kind: "Int",
            value: "14"
          }
        ],
        right: [
          {
            type: "number_literal",
            kind: "Int",
            value: "8"
          }
        ]
      });
    });
  });
});
