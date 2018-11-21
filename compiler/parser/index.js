const Lexer = require('../lexer');
const {
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
} = require('../lexer/tokens');

const {
  ClosureNode,
  FunctionNode,
  InvocationNode,
  NumberNode,
  VariableNode
} = require('../graph/nodes');

class Parser {
  constructor (options) {
    this.options = options || {};
    this.lexer = null;
  }

  parse (input) {
    this.lexer = new Lexer(input);
    this.moduleScope = new ClosureNode();

    this.readTokens();
  }

  connect (edge) {
    this.moduleScope.addOutgoing(edge);
    return edge;
  }

  // top level parser to handle main blocks in a source file
  parsePrimaryExpression () {
    const currentToken = this.peekNextToken();

    if (!currentToken) {
      return; // EOF
    }

    switch (currentToken.constructor) {
      case KeywordToken:
        return this.connect(this.parseKeywordExpression(currentToken));
    }

    return this.connect(this.parseExpression());
  }

  parseExpression () {
    const left = this.parseAtomic();
    let right = null;

    const operator = this.peekNextToken();
    if (operator instanceof OperatorToken) {
      this.getNextToken(); // consume operator

      right = this.parseExpression();

      const terminator = this.peekNextToken();

      if (terminator instanceof PunctuatorToken && terminator.value === ';') {
        this.validateNextToken(';');
      }

      return {
        left,
        operator,
        right
      };
    }

    const terminator = this.peekNextToken();

    if (terminator instanceof PunctuatorToken && terminator.value === ';') {
      this.validateNextToken(';');
    }

    return left; // base case
  }

  parseAtomic () {
    const currentToken = this.peekNextToken();

    switch (currentToken.constructor) {
      case NumberToken:
        return this.parseNumberLiteral();
      case IdentifierToken:
        return this.parseIdentifierExpression();
      // TODO: string literals
    }

    return null;
  }

  // keywords
  parseKeywordExpression (keywordToken) {
    if (keywordToken.value === 'const' || keywordToken.value === 'let') {
      return this.parseVariableDeclaration();
    } else if (keywordToken.value === 'function') {
      return this.parseFunctionDeclaration();
    } else if (keywordToken.value === 'return') {
      return this.parseReturnExpression();
    }
  }

  parseReturnExpression () {
    this.validateNextToken('return');

    return this.parseExpression();
  }

  // functions
  parseFunctionDeclaration () {
    this.validateNextToken('function');
    const funcIdentifier = this.getNextToken();

    if (!(funcIdentifier instanceof IdentifierToken)) {
      return null;
    }

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

    this.validateNextToken('{');

    const body = this.parsePrimaryExpression();

    this.validateNextToken('}');

    return new FunctionNode(funcIdentifier.value, args, body);
  }

  parseFunctionInvocation (funcIdentifier) {
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

    return new InvocationNode(funcIdentifier, args);
  }

  // variables
  parseVariableDeclaration () {
    const declarationType = this.getNextToken();
    const identifier = this.parseIdentifier();

    if (declarationType.value === 'const') {
      // an assignment expression is required
      this.validateNextToken('=');
      const assignmentExpr = this.parseExpression();

      return new VariableNode(false, identifier, assignmentExpr);
    } else if (declarationType.value === 'let') {
      let assignmentExpr = null;
      let token = this.peekNextToken();

      // assignment is optional for mutable vars
      if (token instanceof OperatorToken && token.value === '=') {
        this.validateNextToken('=');

        assignmentExpr = this.parseExpression();
      }

      return new VariableNode(true, identifier, assignmentExpr);
    }
  }

  // atomics and literals
  parseIdentifier () {
    const identifier = this.getNextToken();

    if (identifier instanceof IdentifierToken) {
      return identifier.value;
    }

    return null;
  }

  parseNumberLiteral () {
    const literal = this.getNextToken();

    if (literal instanceof NumberToken) {
      return new NumberNode(literal.value);
    }

    return null;
  }

  parseIdentifierExpression () {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation
    if (token instanceof PunctuatorToken && token.value === '(') {
      return this.parseFunctionInvocation(identifier);
    }

    return identifier;
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
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }

    return null;
  }

  readTokens () {
    this.tokens = this.lexer.tokenize();
    this.pos = 0;
  }
}

module.exports = Parser;
