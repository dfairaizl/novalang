const Scanner = require('../util/scanner');

const WHITE_SPACE = new RegExp(/^\s+$/);
const OPERATOR = new RegExp(/[+-/*><=]+/);
const PUNCTUATOR = new RegExp(/[{},;()'"]+/);
const DIGIT = new RegExp(/[0-9.]+/);

class Lexer {
  constructor (input) {
    this.rawInput = input;
    this.inputLength = input.length;
    this.scanner = new Scanner(input);

    this.currentToken = null;
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

  // tokenization

  readOperator () {
    let token = this.currentToken;

    while (this.isOperator() && !this.scanner.eof()) {
      token += this.scanner.getChar();
    }

    return token;
  }

  readPunctuator () {
    let token = this.currentToken;

    while (this.isPunctuator() && !this.scanner.eof()) {
      token += this.scanner.getChar();
    }

    return token;
  }

  readDigit () {
    let token = this.currentToken;

    while (this.isDigit() && !this.scanner.eof()) {
      token += this.scanner.getChar();
    }

    return token;
  }

  readIdentifier () {
    let token = this.currentToken;

    while (!this.isWhiteSpace() && !this.scanner.eof()) {
      token += this.scanner.getChar();
    }

    return token;
  }

  nextToken () {
    while (this.isWhiteSpace()) {
      this.currentToken = this.scanner.getChar();
    }

    while (!this.scanner.eof()) {
      this.currentToken = this.scanner.getChar();

      if (this.isWhiteSpace()) {
        break;
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
}

module.exports = Lexer;
