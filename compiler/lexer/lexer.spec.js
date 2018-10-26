/* global describe, it, expect */

const Lexer = require('.');

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
      expect(lex.tokenize()).toEqual(['const', 'a', '=', '40', '+', '2']);
    });
  });

  describe('whitespace', () => {
    it('skips white space before tokens', () => {
      const lex = new Lexer('    +');
      expect(lex.nextToken()).toEqual('+');
    });

    it('skips white space between tokens', () => {
      const lex = new Lexer('1   +   2');

      expect(lex.nextToken()).toEqual('1');
      expect(lex.nextToken()).toEqual('+');
      expect(lex.nextToken()).toEqual('2');
    });

    it('skips white space after tokens', () => {
      const lex = new Lexer('+    ');

      expect(lex.nextToken()).toEqual('+');
      expect(lex.nextToken()).toBe(null);
    });
  });

  describe('operators', () => {
    it('lexes `+`', () => {
      const lex = new Lexer('+');
      expect(lex.nextToken()).toEqual('+');
    });

    it('lexes `-`', () => {
      const lex = new Lexer('-');
      expect(lex.nextToken()).toEqual('-');
    });

    it('lexes `*`', () => {
      const lex = new Lexer('*');
      expect(lex.nextToken()).toEqual('*');
    });

    it('lexes `/`', () => {
      const lex = new Lexer('/');
      expect(lex.nextToken()).toEqual('/');
    });

    it('lexes `>`', () => {
      const lex = new Lexer('>');
      expect(lex.nextToken()).toEqual('>');
    });

    it('lexes `<`', () => {
      const lex = new Lexer('<');
      expect(lex.nextToken()).toEqual('<');
    });

    it('lexes `=`', () => {
      const lex = new Lexer('=');
      expect(lex.nextToken()).toEqual('=');
    });

    it('lexes `<=`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual('<=');
    });

    it('lexes `===`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual('<=');
    });

    it('lexes `!==`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual('<=');
    });

    it('lexes `+=`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual('<=');
    });

    it('lexes `-=`', () => {
      const lex = new Lexer('<=');
      expect(lex.nextToken()).toEqual('<=');
    });

    it('lexes `=>`', () => {
      const lex = new Lexer('=>');
      expect(lex.nextToken()).toEqual('=>');
    });
  });

  describe('puncuation', () => {
    it('lexes `{`', () => {
      const lex = new Lexer('{');
      expect(lex.nextToken()).toEqual('{');
    });

    it('lexes `}`', () => {
      const lex = new Lexer('}');
      expect(lex.nextToken()).toEqual('}');
    });

    it('lexes `,`', () => {
      const lex = new Lexer(',');
      expect(lex.nextToken()).toEqual(',');
    });

    it('lexes `;`', () => {
      const lex = new Lexer(';');
      expect(lex.nextToken()).toEqual(';');
    });

    it('lexes `(`', () => {
      const lex = new Lexer('(');
      expect(lex.nextToken()).toEqual('(');
    });

    it('lexes `)`', () => {
      const lex = new Lexer(')');
      expect(lex.nextToken()).toEqual(')');
    });

    it('lexes `\'`', () => {
      const lex = new Lexer('\'');
      expect(lex.nextToken()).toEqual('\'');
    });

    it('lexes `"`', () => {
      const lex = new Lexer('"');
      expect(lex.nextToken()).toEqual('"');
    });

    it('lexes `()` as two seprate punctuators', () => {
      const lex = new Lexer('()');
      expect(lex.nextToken()).toEqual('(');
      expect(lex.nextToken()).toEqual(')');
    });
  });

  describe('numbers', () => {
    it('lexes `1`', () => {
      const lex = new Lexer('1');
      expect(lex.nextToken()).toEqual('1');
    });

    it('lexes `10`', () => {
      const lex = new Lexer('10');
      expect(lex.nextToken()).toEqual('10');
    });

    it('lexes `100`', () => {
      const lex = new Lexer('100');
      expect(lex.nextToken()).toEqual('100');
    });

    it('lexes `1.0`', () => {
      const lex = new Lexer('1.0');
      expect(lex.nextToken()).toEqual('1.0');
    });

    it('lexes `3.14159`', () => {
      const lex = new Lexer('3.14159');
      expect(lex.nextToken()).toEqual('3.14159');
    });
  });

  describe('identifiers', () => {
    it('lexes `something`', () => {
      const lex = new Lexer('something');
      expect(lex.nextToken()).toEqual('something');
    });

    it('lexes `c1`', () => {
      const lex = new Lexer('c1');
      expect(lex.nextToken()).toEqual('c1');
    });
  });
});
