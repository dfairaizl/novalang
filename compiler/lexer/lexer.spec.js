/* global describe, it, expect */

const Lexer = require('.');

const {
  IdentifierToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
} = require('./tokens');

describe('Lexer', () => {
  describe('getToken()', () => {
    it('does not tokenize empty input', () => {
      const lex = new Lexer('');

      expect(lex.nextToken()).toBe(null);
    });
  });

  describe('tokenize()', () => {
    it('returns an array of tokens from the given input', () => {
      const lex = new Lexer('const a = 40 + 2');
      expect(lex.tokenize()).toEqual([
        new IdentifierToken('const'),
        new IdentifierToken('a'),
        new OperatorToken('='),
        new NumberToken('40'),
        new OperatorToken('+'),
        new NumberToken('2')
      ]);
    });
  });

  describe('whitespace', () => {
    it('skips white space before tokens', () => {
      const lex = new Lexer('    +');
      expect(lex.nextToken()).toEqual(new OperatorToken('+'));
    });

    it('skips white space between tokens', () => {
      const lex = new Lexer('1   +   2');

      expect(lex.nextToken()).toEqual(new NumberToken('1'));
      expect(lex.nextToken()).toEqual(new OperatorToken('+'));
      expect(lex.nextToken()).toEqual(new NumberToken('2'));
    });

    it('skips white space after tokens', () => {
      const lex = new Lexer('+    ');

      expect(lex.nextToken()).toEqual(new OperatorToken('+'));
      expect(lex.nextToken()).toBe(null);
    });
  });

  describe('operators', () => {
    it('lexes `+`', () => {
      const lex = new Lexer('+');
      expect(lex.nextToken()).toEqual(new OperatorToken('+'));
    });

    it('lexes `-`', () => {
      const lex = new Lexer('-');
      expect(lex.nextToken()).toEqual(new OperatorToken('-'));
    });

    it('lexes `*`', () => {
      const lex = new Lexer('*');
      expect(lex.nextToken()).toEqual(new OperatorToken('*'));
    });

    it('lexes `/`', () => {
      const lex = new Lexer('/');
      expect(lex.nextToken()).toEqual(new OperatorToken('/'));
    });

    it('lexes `>`', () => {
      const lex = new Lexer('>');
      expect(lex.nextToken()).toEqual(new OperatorToken('>'));
    });

    it('lexes `<`', () => {
      const lex = new Lexer('<');
      expect(lex.nextToken()).toEqual(new OperatorToken('<'));
    });

    it('lexes `=`', () => {
      const lex = new Lexer('=');
      expect(lex.nextToken()).toEqual(new OperatorToken('='));
    });

    it('lexes `<=`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual(new OperatorToken('<='));
    });

    it('lexes `===`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual(new OperatorToken('<='));
    });

    it('lexes `!==`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual(new OperatorToken('<='));
    });

    it('lexes `+=`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual(new OperatorToken('<='));
    });

    it('lexes `-=`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual(new OperatorToken('<='));
    });

    it('lexes `=>`', () => {
      const lex = new Lexer('=>');
      expect(lex.nextToken()).toEqual(new OperatorToken('=>'));
    });
  });

  describe('puncuation', () => {
    it('lexes `{`', () => {
      const lex = new Lexer('{');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('{'));
    });

    it('lexes `}`', () => {
      const lex = new Lexer('}');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('}'));
    });

    it('lexes `,`', () => {
      const lex = new Lexer(',');
      expect(lex.nextToken()).toEqual(new PunctuatorToken(','));
    });

    it('lexes `;`', () => {
      const lex = new Lexer(';');
      expect(lex.nextToken()).toEqual(new PunctuatorToken(';'));
    });

    it('lexes `(`', () => {
      const lex = new Lexer('(');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('('));
    });

    it('lexes `)`', () => {
      const lex = new Lexer(')');
      expect(lex.nextToken()).toEqual(new PunctuatorToken(')'));
    });

    it('lexes `\'`', () => {
      const lex = new Lexer('\'');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('\''));
    });

    it('lexes `"`', () => {
      const lex = new Lexer('"');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('"'));
    });

    it('lexes `()` as two seprate punctuators', () => {
      const lex = new Lexer('()');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('('));
      expect(lex.nextToken()).toEqual(new PunctuatorToken(')'));
    });
  });

  describe('numbers', () => {
    it('lexes `1`', () => {
      const lex = new Lexer('1');
      expect(lex.nextToken()).toEqual(new NumberToken('1'));
    });

    it('lexes `10`', () => {
      const lex = new Lexer('10');
      expect(lex.nextToken()).toEqual(new NumberToken('10'));
    });

    it('lexes `100`', () => {
      const lex = new Lexer('100');
      expect(lex.nextToken()).toEqual(new NumberToken('100'));
    });

    it('lexes `1.0`', () => {
      const lex = new Lexer('1.0');
      expect(lex.nextToken()).toEqual(new NumberToken('1.0'));
    });

    it('lexes `3.14159`', () => {
      const lex = new Lexer('3.14159');
      expect(lex.nextToken()).toEqual(new NumberToken('3.14159'));
    });
  });

  describe('identifiers', () => {
    it('lexes `something`', () => {
      const lex = new Lexer('something');
      expect(lex.nextToken()).toEqual(new IdentifierToken('something'));
    });

    it('lexes `c1`', () => {
      const lex = new Lexer('c1');
      expect(lex.nextToken()).toEqual(new IdentifierToken('c1'));
    });
  });
});
