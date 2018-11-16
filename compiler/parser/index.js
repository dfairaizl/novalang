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
    let idExpr = this.parsePrimary();
    return idExpr;
  }

  parsePrimary () {
    if (this.peekNextToken() instanceof IdentifierToken) {
      return this.parseIdentifier();
    } else if (this.peekNextToken() instanceof NumberToken) {
      return this.parseNumber();
    } else if (this.peekNextToken() instanceof PunctuatorToken && this.peekNextToken().value === '(') {
      return this.parseParenExpression();
    }
  }

  parseBinaryExpression () {
    debugger;
    const leftExpr = this.getNextToken();

    // determine operator type
    const operator = this.getNextToken();
    if (!(operator instanceof OperatorToken)) {
      return leftExpr;
    }

    const rightExpr = this.parseExpression();

    return {
      operator: operator.value,
      left: leftExpr.value,
      right: rightExpr.value
    };
  }

  parseIdentifier () {
    const identifier = this.getNextToken();

    return identifier;
  }

  parseNumber () {
    const numIdentifier = this.getNextToken();

    return numIdentifier;
  }

  parseParenExpression () {
    this.getNextToken(); // consume `(`

    const expr = this.parseExpression();

    if (this.getNextToken().value !== ')') {
      return null;
    }
  }

  parseInvocation () {
    const funcIdentifier = this.getNextToken();
    const args = [];
    this.getNextToken(); // `(`

    let paramTok = this.getNextToken();
    while (paramTok !== ')') {
      args.push(paramTok);
      paramTok = this.getNextToken();

      if (paramTok === ',') {
        paramTok = this.getNextToken();
        continue;
      } else {
        break;
      }
    }

    return {
      name: funcIdentifier,
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
