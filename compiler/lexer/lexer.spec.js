/* global describe, it, expect */

const Lexer = require('.');

const {
  BooleanToken,
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken,
  StringToken
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
        new NumberToken('40', { kind: 'Int' }),
        new OperatorToken('+'),
        new NumberToken('2', { kind: 'Int' })
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

      expect(lex.nextToken()).toEqual(new NumberToken('1', { kind: 'Int' }));
      expect(lex.nextToken()).toEqual(new OperatorToken('+'));
      expect(lex.nextToken()).toEqual(new NumberToken('2', { kind: 'Int' }));
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

    it('does not lex `*,`', () => {
      const lex = new Lexer('*,');
      expect(lex.nextToken()).toEqual(new OperatorToken('*'));
      expect(lex.nextToken()).toEqual(new PunctuatorToken(','));
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

    it('lexes `:`', () => {
      const lex = new Lexer(':');
      expect(lex.nextToken()).toEqual(new PunctuatorToken(':'));
    });

    it('lexes `(`', () => {
      const lex = new Lexer('(');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('('));
    });

    it('lexes `)`', () => {
      const lex = new Lexer(')');
      expect(lex.nextToken()).toEqual(new PunctuatorToken(')'));
    });

    // it('lexes `\'`', () => {
    //   const lex = new Lexer('\'');
    //   expect(lex.nextToken()).toEqual(new PunctuatorToken('\''));
    // });
    //
    // it('lexes `"`', () => {
    //   const lex = new Lexer('"');
    //   expect(lex.nextToken()).toEqual(new PunctuatorToken('"'));
    // });

    it('lexes `()` as two seprate punctuators', () => {
      const lex = new Lexer('()');
      expect(lex.nextToken()).toEqual(new PunctuatorToken('('));
      expect(lex.nextToken()).toEqual(new PunctuatorToken(')'));
    });
  });

  describe('numbers', () => {
    it('lexes `1`', () => {
      const lex = new Lexer('1');
      expect(lex.nextToken()).toEqual(new NumberToken('1', { kind: 'Int' }));
    });

    it('lexes `10`', () => {
      const lex = new Lexer('10');
      expect(lex.nextToken()).toEqual(new NumberToken('10', { kind: 'Int' }));
    });

    it('lexes `100`', () => {
      const lex = new Lexer('100');
      expect(lex.nextToken()).toEqual(new NumberToken('100', { kind: 'Int' }));
    });

    it('lexes `1.0`', () => {
      const lex = new Lexer('1.0');
      expect(lex.nextToken()).toEqual(new NumberToken('1.0', { kind: 'Float' }));
    });

    it('lexes `3.14159`', () => {
      const lex = new Lexer('3.14159');
      expect(lex.nextToken()).toEqual(new NumberToken('3.14159', { kind: 'Float' }));
    });
  });

  describe('booleans', () => {
    it('lexes true boolean literal', () => {
      const lex = new Lexer('true');
      expect(lex.nextToken()).toEqual(new BooleanToken('true'));
    });

    it('lexes false boolean literal', () => {
      const lex = new Lexer('false');
      expect(lex.nextToken()).toEqual(new BooleanToken('false'));
    });
  });

  describe('strings', () => {
    it('lexes string literals from single quotes', () => {
      const lex = new Lexer("'hello world'");
      expect(lex.nextToken()).toEqual(new StringToken('hello world'));
    });

    it('lexes string literals from double quotes', () => {
      const lex = new Lexer('"hello world"');
      expect(lex.nextToken()).toEqual(new StringToken('hello world'));
    });
  });

  describe('keywords', () => {
    it('lexes `const`', () => {
      const lex = new Lexer('const');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('const'));
    });

    it('lexes `class`', () => {
      const lex = new Lexer('class');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('class'));
    });

    it('lexes `constructor`', () => {
      const lex = new Lexer('constructor');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('constructor'));
    });

    it('lexes `do`', () => {
      const lex = new Lexer('do');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('do'));
    });

    it('lexes `extends`', () => {
      const lex = new Lexer('extends');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('extends'));
    });

    it('lexes `external`', () => {
      const lex = new Lexer('external');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('external'));
    });

    it('lexes `function`', () => {
      const lex = new Lexer('function');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('function'));
    });

    it('lexes `from`', () => {
      const lex = new Lexer('from');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('from'));
    });

    it('lexes `if`', () => {
      const lex = new Lexer('if');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('if'));
    });

    it('lexes `import`', () => {
      const lex = new Lexer('import');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('import'));
    });

    it('lexes `let`', () => {
      const lex = new Lexer('let');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('let'));
    });

    it('lexes `return`', () => {
      const lex = new Lexer('return');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('return'));
    });

    it('lexes `while`', () => {
      const lex = new Lexer('while');
      const token = lex.nextToken();

      expect(token).toBeInstanceOf(KeywordToken);
      expect(token).toEqual(new KeywordToken('while'));
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

    it('lexes `key.value` as separate tokens', () => {
      const lex = new Lexer('key.value');
      expect(lex.nextToken()).toEqual(new IdentifierToken('key'));
      expect(lex.nextToken()).toEqual(new OperatorToken('.'));
      expect(lex.nextToken()).toEqual(new IdentifierToken('value'));
    });
  });
});
