const Scanner = require('../util/scanner');

const {
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
} = require('./tokens');

const WHITE_SPACE = new RegExp(/^\s+$/);
const OPERATOR = new RegExp(/[+-/*><=]+/);
const PUNCTUATOR = new RegExp(/[{},;:()'"]+/);
const DIGIT = new RegExp(/[0-9.]+/);
const KEYWORDS = [
  'class',
  'const',
  'constructor',
  'extends',
  'function',
  'let',
  'return'
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

    while (this.isDigit() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    return new NumberToken(token);
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

    if (KEYWORDS.includes(token)) {
      return new KeywordToken(token);
    }

    return new IdentifierToken(token);
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
