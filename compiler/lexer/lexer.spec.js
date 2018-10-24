/* global describe, it, expect */

const Lexer = require('.');

describe('Lexer', () => {
  describe('getToken()', () => {
    it('does not tokenize empty input', () => {
      const lex = new Lexer('');

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
  });
});
