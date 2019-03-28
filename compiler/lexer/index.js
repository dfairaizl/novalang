const Scanner = require('../util/scanner');

const {
  BooleanToken,
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken,
  StringToken
} = require('./tokens');

const DIGIT = new RegExp(/[0-9.]+/);
const FLOATING_POINT_DIGIT = new RegExp(/\d+\.\d+/);
const OPERATOR = new RegExp(/[[\]+\-/*.><=!]+/);
const PUNCTUATOR = new RegExp(/[{},;:()]+/);
const STRING = new RegExp(/['"]+/);
const WHITE_SPACE = new RegExp(/^\s+$/);

const BOOLEAN = [
  'true',
  'false'
];

const KEYWORDS = [
  'class',
  'const',
  'constructor',
  'do',
  'export',
  'extends',
  'external',
  'from',
  'function',
  'if',
  'import',
  'let',
  'new',
  'return',
  'while'
];

class Lexer {
  constructor (input) {
    this.scanner = new Scanner(input);

    this.currentToken = null;
  }

  isNull () {
    return this.currentToken === null;
  }

  isWhiteSpace () {
    return WHITE_SPACE.test(this.currentToken) === true;
  }

  isOperator () {
    return OPERATOR.test(this.currentToken) === true;
  }

  isPunctuator () {
    return PUNCTUATOR.test(this.currentToken) === true;
  }

  isDigit () {
    return DIGIT.test(this.currentToken) === true;
  }

  isIdentifier () {
    return !this.isNull() && !this.isOperator() && !this.isPunctuator();
  }

  isString () {
    // denotes the begining of a string
    return STRING.test(this.currentToken) === true;
  }

  // tokenization

  readOperator () {
    let token = '';

    while (this.isOperator() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    return new OperatorToken(token);
  }

  readPunctuator () {
    let token = this.currentToken;

    this.nextCharacter();

    return new PunctuatorToken(token);
  }

  readDigit () {
    let token = '';
    let kind = 'Int';

    while (this.isDigit() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    if (FLOATING_POINT_DIGIT.test(token) === true) {
      kind = 'Float';
    }

    return new NumberToken(token, { kind });
  }

  readKeywordOrIdentifier () {
    let token = '';

    if (this.isNull()) {
      return null;
    }

    while (!this.isWhiteSpace() && this.isIdentifier() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    if (BOOLEAN.includes(token)) {
      return new BooleanToken(token);
    }

    if (KEYWORDS.includes(token)) {
      return new KeywordToken(token);
    }

    return new IdentifierToken(token);
  }

  readString () {
    let token = '';
    this.nextCharacter();

    while (!this.isString()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    this.nextCharacter();

    return new StringToken(token);
  }

  nextToken () {
    if (!this.scanner.eof()) {
      if (this.isNull()) {
        this.nextCharacter();
      }

      // skip any leading whitespace
      while (this.isWhiteSpace()) {
        this.nextCharacter();
      }

      // tokenize the current character
      if (this.isPunctuator()) {
        return this.readPunctuator();
      }

      if (this.isOperator()) {
        return this.readOperator();
      }

      if (this.isDigit()) {
        return this.readDigit();
      }

      if (this.isString()) {
        return this.readString();
      }

      return this.readKeywordOrIdentifier();
    }

    return null;
  }

  tokenize () {
    const tokens = [];

    do {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    } while (this.currentToken !== null);

    return tokens;
  }

  nextCharacter () {
    this.currentToken = this.scanner.getChar();
  }
}

module.exports = Lexer;
