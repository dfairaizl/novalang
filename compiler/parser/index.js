const Lexer = require('../lexer');
const {
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
} = require('../lexer/tokens');

const Graph = require('../graph/graph');

class Parser {
  constructor (input, options) {
    this.options = options || {};

    this.lexer = new Lexer(input);
    this.sourceGraph = new Graph();

    this.readTokens();
  }

  // Decent Parsing Methods

  parse () {
    const codeModule = this.sourceGraph.addNode({ type: 'module' });
    let currentExpression = null;

    while ((currentExpression = this.parsePrimaryExpression())) {
      this.sourceGraph.addEdge(codeModule, currentExpression, 'sources');
    }

    return codeModule;
  }

  // top level parser to handle main blocks in a source file
  parsePrimaryExpression () {
    const currentToken = this.peekNextToken();

    if (!currentToken) {
      return; // EOF
    }

    switch (currentToken.constructor) {
      case KeywordToken:
        return this.parseKeywordExpression(currentToken);
    }

    return this.parseExpression();
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
    } else if (keywordToken.value === 'class') {
      return this.parseClassDefinition();
    }
  }

  parseReturnExpression () {
    this.validateNextToken('return');

    const returnExpr = this.sourceGraph.addNode({ type: 'return_statement' });
    const expr = this.parseExpression();

    this.sourceGraph.addEdge(returnExpr, expr, 'expression');

    return returnExpr;
  }

  // Parsing methods

  parseExpression () {
    const left = this.parseAtomic();
    let right = null;

    const operator = this.peekNextToken();
    if (operator instanceof OperatorToken) {
      this.getNextToken(); // consume operator

      right = this.parseExpression();

      const binOp = this.sourceGraph.addNode({ type: 'bin_op', operator: operator.value });
      this.sourceGraph.addEdge(binOp, left, 'left');
      this.sourceGraph.addEdge(binOp, right, 'right');

      return binOp;
    }

    const terminator = this.peekNextToken();

    if (terminator instanceof PunctuatorToken && terminator.value === ';') {
      this.validateNextToken(';');
    }

    return left; // base case
  }

  // functions
  parseFunctionDeclaration () {
    this.validateNextToken('function');
    const funcIdentifier = this.getNextToken();

    if (!(funcIdentifier instanceof IdentifierToken)) {
      return null;
    }

    const args = this.parseArgumentsList();

    this.validateNextToken('{');

    const funcNode = this.sourceGraph.addNode({ type: 'function', name: funcIdentifier.value, args });

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(funcNode, bodyNode, 'body');
    }

    this.validateNextToken('}');

    return funcNode;
  }

  parseFunctionInvocation (funcIdentifier) {
    const args = this.parseArgumentsList();
    return this.sourceGraph.addNode({ type: 'invocation', name: funcIdentifier, args });
  }

  // variables
  parseVariableDeclaration () {
    const declarationType = this.getNextToken();
    const identifier = this.parseIdentifier();

    if (declarationType.value === 'const') {
      // an assignment expression is required
      this.validateNextToken('=');
      const assignmentExpr = this.parseExpression();

      const declareNode = this.sourceGraph.addNode({ type: 'immutable_declaration', identifier });
      this.sourceGraph.addEdge(declareNode, assignmentExpr, 'expression');

      return declareNode;
    } else {
      let assignmentExpr = null;
      let token = this.peekNextToken();

      // assignment is optional for mutable vars
      if (token instanceof OperatorToken && token.value === '=') {
        this.validateNextToken('=');

        assignmentExpr = this.parseExpression();
      }

      const declareNode = this.sourceGraph.addNode({ type: 'mutable_declaration', identifier });
      this.sourceGraph.addEdge(declareNode, assignmentExpr, 'expression');

      return declareNode;
    }
  }

  // classes
  parseClassDefinition () {
    this.validateNextToken('class');
    const className = this.getNextToken();

    // super class
    let superClass = null;
    const token = this.peekNextToken();
    if (token instanceof KeywordToken && token.value === 'extends') {
      this.validateNextToken('extends');
      superClass = this.getNextToken().value;
    }

    this.validateNextToken('{');

    const classDef = this.sourceGraph.addNode({
      type: 'class_definition',
      identifier: className.value,
      super_class: superClass
    });

    // class body (constructor and methods)
    let classExpr = null;
    while ((classExpr = this.parseClassMethod())) {
      this.sourceGraph.addEdge(classDef, classExpr, 'body');
    }

    return classDef;
  }

  parseClassMethod () {
    const methodIdentifier = this.getNextToken();
    let methodType = null;

    if (methodIdentifier instanceof KeywordToken) {
      methodType = 'constructor';
    } else if (methodIdentifier instanceof IdentifierToken) {
      methodType = 'method';
    } else {
      return null;
    }

    const args = this.parseArgumentsList();

    this.validateNextToken('{');

    const methodNode = this.sourceGraph.addNode({ type: methodType, name: methodIdentifier.value, args });

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(methodNode, bodyNode, 'body');
    }

    this.validateNextToken('}');

    return methodNode;
  }

  parseArgumentsList () {
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

    return args;
  }

  // atomics and literals
  parseIdentifier () {
    const identifier = this.getNextToken();
    return identifier.value;
  }

  parseNumberLiteral () {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({ type: 'number_literal', value: literal.value });
  }

  parseIdentifierExpression () {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation
    if (token instanceof PunctuatorToken && token.value === '(') {
      return this.parseFunctionInvocation(identifier);
    }

    return this.sourceGraph.addNode({ type: 'identifier', identifier });
  }

  // Helper

  toAST (node) {
    return this.sourceGraph.treeFromNode(node);
  }

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
