const Lexer = require('../lexer');
const {
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
} = require('../lexer/tokens');

class Parser {
  constructor (options) {
    this.options = options || {};
    this.lexer = null;
  }

  parse (input) {
    this.lexer = new Lexer(input);

    this.readTokens();
  }

  // top level parser to handle main blocks in a source file
  parseExpression () {
    const currentToken = this.peekNextToken();

    switch (currentToken.constructor) {
      case KeywordToken:
        return this.parseKeywordExpression(currentToken);
      case NumberToken:
        return this.parseNumberLiteral();
    }

    return null;
  }

  // keywords
  parseKeywordExpression (keywordToken) {
    if (keywordToken.value === 'const' || keywordToken.value === 'let') {
      return this.parseVariableDeclaration();
    }
  }

  // variables
  parseVariableDeclaration () {
    const declarationType = this.getNextToken();
    const identifier = this.parseIdentifier();

    if (declarationType.value === 'const') {
      // an assignment expression is required
      this.validateNextToken('=');
      const assignmentExpr = this.parseExpression();

      return {
        mutable: false,
        identifier,
        assignmentExpr
      };
    } else if (declarationType.value === 'let') {
      let assignmentExpr = null;
      let token = this.peekNextToken();

      // assignment is optional for mutable vars
      if (token instanceof OperatorToken && token.value === '=') {
        this.validateNextToken('=');

        assignmentExpr = this.parseExpression();
      }

      return {
        mutable: true,
        identifier,
        assignmentExpr
      };
    }
  }

  // atomics and literals
  parseIdentifier () {
    const identifier = this.getNextToken();

    if (identifier instanceof IdentifierToken) {
      return {
        identifier: identifier.value
      };
    }

    return null;
  }

  parseNumberLiteral () {
    const literal = this.getNextToken();

    if (literal instanceof NumberToken) {
      return {
        value: literal.value
      };
    }

    return null;
  }

  // helper methods
  validateNextToken (tokenValue) {
    // interput parsing execution if we find a syntax error
    if (this.getNextToken().value !== tokenValue) {
      throw new Error(`Expected \`${tokenValue}\``);
    }
  }

  getNextToken () {
    const tok = this.tokens[this.pos];
    this.pos++;

    return tok;
  }

  peekNextToken () {
    return this.tokens[this.pos];
  }

  readTokens () {
    this.tokens = this.lexer.tokenize();
    this.pos = 0;
  }
}

module.exports = Parser;
