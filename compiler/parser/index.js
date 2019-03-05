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
  constructor (input, name, options) {
    this.options = options || {};

    if (name) {
      this.moduleName = name;
    } else {
      this.moduleName = 'main_module';
    }

    this.lexer = new Lexer(input);
    this.sourceGraph = new Graph();

    this.readTokens();
  }

  // Decent Parsing Methods

  parse () {
    const codeModule = this.sourceGraph.addNode({ type: 'module', name: this.moduleName });
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
    } else if (keywordToken.value === 'do') {
      return this.parseDoWhileLoop();
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

      let opNode = null;
      if (operator.value === '=') {
        opNode = this.sourceGraph.addNode({ type: 'assignment', operator: operator.value });
      } else {
        opNode = this.sourceGraph.addNode({ type: 'bin_op', operator: operator.value });
      }

      this.sourceGraph.addEdge(opNode, left, 'left');
      this.sourceGraph.addEdge(opNode, right, 'right');

      return opNode;
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

  parseDoWhileLoop () {
    this.validateNextToken('do');
    this.validateNextToken('{');

    const loopNode = this.sourceGraph.addNode({ type: 'do_while_loop' });

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(loopNode, bodyNode, 'body');
    }

    this.validateNextToken('}');
    this.validateNextToken('while');
    this.validateNextToken('(');

    const testExpr = this.parsePrimaryExpression();
    this.sourceGraph.addEdge(loopNode, testExpr, 'test');

    this.validateNextToken(')');

    return loopNode;
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

    let funcNode;
    const args = this.parseFunctionArguments();
    const funcKind = this.parseFunctionType();

    if (funcKind) {
      funcNode = this.sourceGraph.addNode({
        type: 'function',
        name: funcIdentifier.value,
        kind: funcKind
      });
    } else {
      funcNode = this.sourceGraph.addNode({
        type: 'function',
        name: funcIdentifier.value
      });
    }

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

  parseFunctionType () {
    const token = this.peekNextToken();
    if (token instanceof OperatorToken && token.value === '->') {
      this.validateNextToken('->');

      const typeToken = this.getNextToken();

      return typeToken.value;
    }

    return null;
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

    if (declarationType.value === 'const') {
      return this.parseImmutable();
    } else {
      return this.parseMutable();
    }
  }

  parseImmutable () {
    let declareNode = null;
    const nodeType = 'immutable_declaration';
    const identifier = this.parseIdentifier();

    // check for type annotation
    const kind = this.parseType();

    if (kind) {
      declareNode = this.sourceGraph.addNode({
        type: nodeType,
        kind,
        identifier
      });
    } else {
      declareNode = this.sourceGraph.addNode({
        type: nodeType,
        identifier
      });
    }

    // const requires an assignment
    this.validateNextToken('=');

    const assignmentExpr = this.parsePrimaryExpression();

    this.sourceGraph.addEdge(declareNode, assignmentExpr, 'expression');

    return declareNode;
  }

  parseMutable () {
    let declareNode = null;
    const nodeType = 'mutable_declaration';
    const identifier = this.parseIdentifier();

    // require for type annotation, but can also be inferred
    const kind = this.parseType();

    // assignment is optional
    const token = this.peekNextToken();
    if (token instanceof OperatorToken && token.value === '=') {
      this.validateNextToken('=');

      if (kind) {
        declareNode = this.sourceGraph.addNode({
          type: nodeType,
          kind, // can be null and inferred from the expression
          identifier
        });
      } else {
        declareNode = this.sourceGraph.addNode({
          type: nodeType,
          identifier
        });
      }

      const assignmentExpr = this.parsePrimaryExpression();
      this.sourceGraph.addEdge(declareNode, assignmentExpr, 'expression');

      return declareNode;
    }

    return this.sourceGraph.addNode({
      type: nodeType,
      kind,
      identifier
    });
  }

  parseType () {
    const token = this.peekNextToken();

    if (token instanceof PunctuatorToken && token.value === ':') {
      this.validateNextToken(':');
      const typeToken = this.getNextToken();

      return typeToken.value;
    }

    return null;
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
        const identifier = this.parseIdentifier();
        const kind = this.parseType();

        if (kind) {
          expr = this.sourceGraph.addNode({ type: 'function_argument', kind, identifier });
        } else {
          expr = this.sourceGraph.addNode({ type: 'function_argument', identifier });
        }
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
    return this.sourceGraph.addNode({
      type: 'boolean_literal',
      kind: 'bool',
      value: literal.value
    });
  }

  parseNumberLiteral () {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({
      type: 'number_literal',
      kind: literal.options.kind,
      value: literal.value
    });
  }

  parseStringLiteral () {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({
      type: 'string_literal',
      kind: 'String',
      value: literal.value
    });
  }

  parseIdentifierExpression () {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation
    if (token instanceof PunctuatorToken && token.value === '(') {
      return this.parseFunctionInvocation(identifier);
    } else if (token instanceof OperatorToken && token.value === '.') {
      this.validateNextToken('.');
      const keyExpr = this.parseKeyPath();
      const refExpr = this.sourceGraph.addNode({ type: 'object_reference', identifier });

      this.sourceGraph.addEdge(refExpr, keyExpr, 'key_expression');

      return refExpr;
    } else if (token instanceof OperatorToken && token.value === '[') {
      this.validateNextToken('[');
      const index = this.parseIdentifier();

      this.validateNextToken(']');

      return this.sourceGraph.addNode({ type: 'array_reference', name: identifier, index });
    }

    return this.sourceGraph.addNode({ type: 'variable_reference', identifier });
  }

  parseKeyPath () {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation of an object key val
    if (token instanceof PunctuatorToken && token.value === '(') {
      return this.parseFunctionInvocation(identifier);
    } else if (token instanceof OperatorToken && token.value === '.') {
      this.validateNextToken('.');
      const keyExpr = this.parseKeyPath();
      const refExpr = this.sourceGraph.addNode({ type: 'object_reference', identifier });

      this.sourceGraph.addEdge(refExpr, keyExpr, 'key_expression');

      return refExpr;
    }

    return this.sourceGraph.addNode({ type: 'key_reference', identifier });
  }

  // Helper

  toAST (node) {
    return this.sourceGraph.treeFromNode(node);
  }

  // Tokenizer

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
