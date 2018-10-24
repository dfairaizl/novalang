const Scanner = require('../util/scanner');

const WHITE_SPACE = new RegExp(/^\s+$/);
const OPERATOR = new RegExp(/[+-/*><=]+/);
const PUNCTUATOR = new RegExp(/[{},;()'"]+/);
const DIGIT = new RegExp(/[0-9.]+/);

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

    while (!this.isNull() && this.isOperator() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    return token;
  }

  readPunctuator () {
    let token = '';

    if (!this.isNull() && this.isPunctuator() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    return token;
  }

  readDigit () {
    let token = '';

    while (!this.isNull() && this.isDigit() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    return token;
  }

  readIdentifier () {
    let token = '';

    while (!this.isWhiteSpace() && this.isIdentifier() && !this.scanner.eof()) {
      token += this.currentToken;
      this.nextCharacter();
    }

    return token;
  }

  nextToken () {
    // skip any leading whitespace
    while (this.isWhiteSpace()) {
      this.nextCharacter();
    }

    if (!this.scanner.eof()) {
      if (this.isNull()) {
        this.nextCharacter();
      }

      if (this.isPunctuator()) {
        return this.readPunctuator();
      }

      if (this.isOperator()) {
        return this.readOperator();
      }

      if (this.isDigit()) {
        return this.readDigit();
      }

      return this.readIdentifier();
    }

    return null;
  }

  nextCharacter () {
    this.currentToken = this.scanner.getChar();
  }
}

module.exports = Lexer;
