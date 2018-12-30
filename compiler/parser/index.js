const Lexer = require('../lexer');
const {
  BooleanToken,
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken,
  StringToken
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

    return this.sourceGraph;
  }

  // top level parser to handle main blocks in a source file
  parsePrimaryExpression () {
    // skip any line terminators
    const terminator = this.peekNextToken();
    if (terminator instanceof PunctuatorToken && terminator.value === ';') {
      this.validateNextToken(';');
    }

    // begin to parse the next expression
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
      case BooleanToken:
        return this.parseBooleanLiteral();
      case NumberToken:
        return this.parseNumberLiteral();
      case IdentifierToken:
        return this.parseIdentifierExpression();
      case PunctuatorToken:
        switch (currentToken.value) {
          case '{':
            return this.parseObjectLiteral();
          case '(':
            return this.parseAnonymousFunction();
        }
        break;
      case OperatorToken:
        return this.parseArrayLiteral();
      case StringToken:
        return this.parseStringLiteral();
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
    } else if (keywordToken.value === 'require') {
      return this.parseModuleRequire();
    } else if (keywordToken.value === 'if') {
      return this.parseConditionalBranch();
    } else if (keywordToken.value === 'while') {
      return this.parseWhileLoop();
    }
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

    return left; // base case
  }

  parseConditionalBranch () {
    const branchNode = this.sourceGraph.addNode({ type: 'conditional_branch' });

    const conditionNode = this.parseIfCondition();

    this.sourceGraph.addEdge(branchNode, conditionNode, 'conditions');

    while (true) {
      const nextCondition = this.peekNextToken();
      if (nextCondition && nextCondition.value === 'else') {
        this.validateNextToken('else');

        const altIf = this.peekNextToken();

        if (altIf && altIf.value === 'if') {
          const conditionNode = this.parseIfCondition();
          this.sourceGraph.addEdge(branchNode, conditionNode, 'conditions');
        } else {
          const elseExpr = this.parseElseCondition();
          this.sourceGraph.addEdge(branchNode, elseExpr, 'else');
        }
      } else {
        break;
      }
    }

    return branchNode;
  }

  parseWhileLoop () {
    this.validateNextToken('while');

    this.validateNextToken('(');

    const testExpr = this.parsePrimaryExpression();

    this.validateNextToken(')');
    this.validateNextToken('{');

    const loopNode = this.sourceGraph.addNode({ type: 'while_loop' });

    this.sourceGraph.addEdge(loopNode, testExpr, 'test');

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(loopNode, bodyNode, 'body');
    }

    this.validateNextToken('}');

    return loopNode;
  }

  parseIfCondition () {
    this.validateNextToken('if');
    this.validateNextToken('(');

    const testExpr = this.parsePrimaryExpression();

    this.validateNextToken(')');
    this.validateNextToken('{');

    const ifNode = this.sourceGraph.addNode({ type: 'if_conditional' });

    this.sourceGraph.addEdge(ifNode, testExpr, 'test');

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(ifNode, bodyNode, 'body');
    }

    this.validateNextToken('}');

    return ifNode;
  }

  parseElseCondition () {
    this.validateNextToken('{');

    const elseNode = this.sourceGraph.addNode({ type: 'else_expression' });

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(elseNode, bodyNode, 'body');
    }

    this.validateNextToken('}');

    return elseNode;
  }

  // objects
  parseObjectLiteral () {
    this.validateNextToken('{');

    const objNode = this.sourceGraph.addNode({ type: 'object_literal' });

    let objTok = this.getNextToken();
    while (objTok.value !== '}') {
      const keyNode = this.sourceGraph.addNode({ type: 'object_key', key: objTok.value });

      this.validateNextToken(':');

      const valNode = this.parsePrimaryExpression();

      this.sourceGraph.addEdge(keyNode, valNode, 'value');
      this.sourceGraph.addEdge(objNode, keyNode, 'member');

      objTok = this.getNextToken();
      if (objTok.value === ',') {
        objTok = this.getNextToken();
        continue;
      } else {
        break;
      }
    }

    return objNode;
  }

  // arrays
  parseArrayLiteral () {
    const operator = this.getNextToken();
    const arrayNode = this.sourceGraph.addNode({ type: 'array_literal' });

    if (operator.value === '[]') {
      // empty array literal
      return arrayNode;
    }

    // array with members
    let tok = null;

    do {
      const expr = this.parseAtomic();
      if (expr) {
        this.sourceGraph.addEdge(arrayNode, expr, 'members');
      }

      tok = this.getNextToken();
    } while (tok.value !== ']');

    return arrayNode;
  }

  // functions
  parseFunctionDeclaration () {
    this.validateNextToken('function');
    const funcIdentifier = this.getNextToken();

    if (!(funcIdentifier instanceof IdentifierToken)) {
      return null;
    }

    const funcNode = this.sourceGraph.addNode({ type: 'function', name: funcIdentifier.value });

    const args = this.parseFunctionArguments();
    args.forEach((a) => {
      this.sourceGraph.addEdge(funcNode, a, 'arguments');
    });

    this.validateNextToken('{');

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
    const invokeNode = this.sourceGraph.addNode({ type: 'invocation', name: funcIdentifier });
    const args = this.parseInvocationArguments();

    args.forEach((a) => {
      this.sourceGraph.addEdge(invokeNode, a, 'arguments');
    });

    return invokeNode;
  }

  parseAnonymousFunction () {
    const funcNode = this.sourceGraph.addNode({ type: 'anonymous_function' });
    const args = this.parseFunctionArguments();

    args.forEach((a) => {
      this.sourceGraph.addEdge(funcNode, a, 'arguments');
    });

    this.validateNextToken('=>');

    this.validateNextToken('{');

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

  // variables
  parseVariableDeclaration () {
    const declarationType = this.getNextToken();
    const identifier = this.parseIdentifier();

    if (declarationType.value === 'const') {
      // an assignment expression is required
      this.validateNextToken('=');
      const assignmentExpr = this.parsePrimaryExpression();

      const declareNode = this.sourceGraph.addNode({ type: 'immutable_declaration', identifier });
      this.sourceGraph.addEdge(declareNode, assignmentExpr, 'expression');

      return declareNode;
    } else {
      let assignmentExpr = null;
      let token = this.peekNextToken();

      // assignment is optional for mutable vars
      if (token instanceof OperatorToken && token.value === '=') {
        this.validateNextToken('=');

        assignmentExpr = this.parsePrimaryExpression();
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

    const methodNode = this.sourceGraph.addNode({ type: methodType, name: methodIdentifier.value });

    const args = this.parseFunctionArguments();
    args.forEach((a) => {
      this.sourceGraph.addEdge(methodNode, a, 'arguments');
    });

    this.validateNextToken('{');

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

  parseFunctionArguments () {
    const args = [];

    this.validateNextToken('(');

    let tok = null;

    do {
      let expr;
      tok = this.peekNextToken();

      if (tok instanceof IdentifierToken) {
        expr = this.parseIdentifierExpression();
      }

      if (expr) {
        args.push(expr);
      }

      tok = this.getNextToken();
    } while (tok.value !== ')');

    return args;
  }

  parseInvocationArguments () {
    const args = [];

    this.validateNextToken('(');

    // array with members
    let tok = null;

    do {
      const expr = this.parseAtomic();
      if (expr) {
        args.push(expr);
      }

      tok = this.getNextToken();
    } while (tok.value !== ')');

    return args;
  }

  // return expression
  parseReturnExpression () {
    this.validateNextToken('return');

    const returnExpr = this.sourceGraph.addNode({ type: 'return_statement' });
    const expr = this.parseExpression();

    this.sourceGraph.addEdge(returnExpr, expr, 'expression');

    return returnExpr;
  }

  // modules

  parseModuleRequire () {
    this.validateNextToken('require');
    this.validateNextToken('(');

    const expr = this.sourceGraph.addNode({ type: 'require_statement' });
    const mod = this.parseExpression();

    this.validateNextToken(')');

    this.sourceGraph.addEdge(expr, mod, 'module');

    return expr;
  }

  // atomics and literals
  parseIdentifier () {
    const identifier = this.getNextToken();
    return identifier.value;
  }

  parseBooleanLiteral () {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({ type: 'boolean_literal', value: literal.value });
  }

  parseNumberLiteral () {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({ type: 'number_literal', value: literal.value });
  }

  parseStringLiteral () {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({ type: 'string_literal', value: literal.value });
  }

  parseIdentifierExpression () {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation
    if (token instanceof PunctuatorToken && token.value === '(') {
      return this.parseFunctionInvocation(identifier);
    } else if (token instanceof OperatorToken && token.value === '.') {
      this.validateNextToken('.');
      const keyPathExpression = this.parsePrimaryExpression();
      const refExpr = this.sourceGraph.addNode({ type: 'object_reference', name: identifier });

      this.sourceGraph.addEdge(refExpr, keyPathExpression, 'key_expression');

      return refExpr;
    } else if (token instanceof OperatorToken && token.value === '[') {
      this.validateNextToken('[');
      const index = this.parseIdentifier();

      this.validateNextToken(']');

      return this.sourceGraph.addNode({ type: 'array_reference', name: identifier, index });
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
