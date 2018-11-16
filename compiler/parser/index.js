const Lexer = require('../lexer');
const {
  IdentifierToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
} = require('../lexer/tokens');

const OPERATORS = '+-*/';

class Parser {
  constructor (options) {
    this.options = options || {};
    this.lexer = null;
  }

  parse (input) {
    this.lexer = new Lexer(input);

    this.readTokens();
  }

  parseExpression () {
    // check current keyword?
    return this.parseBinary();
  }

  // Basic atomic operations
  parseAtomic () {
    const token = this.peekNextToken();

    switch (token.constructor) {
      case IdentifierToken:
        return this.parseIdentifier();
      case NumberToken:
        return this.parseNumber();
    }
  }

  parseIdentifier () {
    const token = this.getNextToken();
    return { identifier: token.value };
  }

  parseNumber () {
    const numIdentifier = this.getNextToken();
    return { value: numIdentifier.value };
  }

  // Binary operations
  parseBinary () {
    const left = this.parseAtomic();
    let right = null;

    const operator = this.peekNextToken();
    if (operator instanceof OperatorToken) {
      this.getNextToken(); // consume operator

      right = this.parseExpression();

      return {
        left,
        operator,
        right
      };
    }

    return left; // base case
  }

  parseParen () {
    this.validateNextToken('(');

    const expr = this.parseExpression();

    this.validateNextToken(')');

    return expr;
  }

  // function operations

  parseInvocation () {
    const funcIdentifier = this.getNextToken();
    const args = [];
    this.validateNextToken('(');

    let paramTok = this.getNextToken();
    while (paramTok.value !== ')') {
      args.push(paramTok.value);
      paramTok = this.getNextToken();

      if (paramTok.value === ',') {
        paramTok = this.getNextToken();
        continue;
      } else {
        break;
      }
    }

    return {
      name: funcIdentifier.value,
      args
    };
  }

  parseFunctionDeclaration () {
    this.getNextToken(); // consume `function` keyword
    const funcName = this.getNextToken();

    this.validateNextToken('(');

    const args = [];

    let paramTok = this.getNextToken();
    while (paramTok.value !== ')') {
      args.push(paramTok.value);

      paramTok = this.getNextToken();

      if (paramTok.value === ',') {
        paramTok = this.getNextToken();
        continue;
      } else {
        break;
      }
    }

    this.validateNextToken('{');

    // TODO: parse function body as primary

    this.validateNextToken('}');

    return {
      name: funcName.value,
      args
    };
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
