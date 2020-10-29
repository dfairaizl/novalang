const Lexer = require("../lexer");
const {
  BooleanToken,
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken,
  StringToken
} = require("../lexer/tokens");

const Graph = require("@novalang/graph");

const OP_PRECEDENCE = {
  "+": 10,
  "-": 10,
  "*": 20,
  "/": 20,
  "%": 20,
  ">": 40,
  "<": 40,
  ">=": 40,
  "<=": 40,
  "==": 40,
  "!=": 40
};

class Parser {
  constructor(input, name, options) {
    this.options = options || {};

    if (name) {
      this.moduleName = name;
    } else {
      this.moduleName = "main_module";
    }

    this.lexer = new Lexer(input);
    this.sourceGraph = new Graph();

    this.readTokens();
  }

  // Decent Parsing Methods

  parse() {
    const codeModule = this.sourceGraph.addNode({
      type: "module",
      identifier: this.moduleName
    });
    let currentExpression = null;

    while ((currentExpression = this.parsePrimaryExpression())) {
      this.sourceGraph.addEdge(codeModule, currentExpression, "sources");
    }

    return this.sourceGraph;
  }

  // top level parser to handle main blocks in a source file
  parsePrimaryExpression() {
    // skip any line terminators
    const terminator = this.peekNextToken();
    if (terminator instanceof PunctuatorToken && terminator.value === ";") {
      this.validateNextToken(";");
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

  parseAtomic() {
    const currentToken = this.peekNextToken();

    switch (currentToken.constructor) {
      case BooleanToken:
        return this.parseBooleanLiteral();
      case NumberToken:
        return this.parseNumberLiteral();
      case IdentifierToken:
      case KeywordToken:
        return this.parseIdentifierExpression();
      case PunctuatorToken:
        switch (currentToken.value) {
          case "{":
            return this.parseObjectLiteral();
          case "(":
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
  parseKeywordExpression(keywordToken) {
    if (keywordToken.value === "const" || keywordToken.value === "let") {
      return this.parseVariableDeclaration();
    } else if (keywordToken.value === "external") {
      return this.parseExternalFunctionDefinition();
    } else if (keywordToken.value === "function") {
      return this.parseFunctionDeclaration();
    } else if (keywordToken.value === "return") {
      return this.parseReturnExpression();
    } else if (keywordToken.value === "import") {
      return this.parseImport();
    } else if (keywordToken.value === "export") {
      return this.parseExport();
    } else if (keywordToken.value === "class") {
      return this.parseClassDefinition();
    } else if (keywordToken.value === "if") {
      return this.parseConditionalBranch();
    } else if (keywordToken.value === "while") {
      return this.parseWhileLoop();
    } else if (keywordToken.value === "do") {
      return this.parseDoWhileLoop();
    } else if (keywordToken.value === "new") {
      return this.parseInstantiation();
    } else if (keywordToken.value === "this") {
      return this.parseInstanceExpression();
    }
  }

  // Parsing methods

  parseExpression() {
    const left = this.parseAtomic();
    let right = null;

    const operator = this.peekNextToken();

    if (operator instanceof OperatorToken) {
      if (operator.value === "=") {
        this.getNextToken(); // consume operator

        const opNode = this.sourceGraph.addNode({
          type: "assignment",
          operator: operator.value
        });

        right = this.parseExpression();

        this.sourceGraph.addEdge(opNode, left, "left");
        this.sourceGraph.addEdge(opNode, right, "right");

        return opNode;
      } else {
        return this.parseBinOp(left, 0); // use `0` as default precedence
      }
    }

    return left;
  }

  parseBinOp(expr, exprPrec) {
    while (true) {
      const tokPrec = this.getTokenPrecedence();

      if (tokPrec < exprPrec) {
        return expr;
      }

      const operator = this.getNextToken();

      let right = this.parseBinOpExpression();

      const nextTokPrec = this.getTokenPrecedence();

      if (tokPrec < nextTokPrec) {
        right = this.parseBinOp(right, tokPrec + 1);
      }

      const opNode = this.sourceGraph.addNode({
        type: "bin_op",
        operator: operator.value
      });
      this.sourceGraph.addEdge(opNode, expr, "left");
      this.sourceGraph.addEdge(opNode, right, "right");

      expr = opNode;
    }
  }

  parseBinOpExpression() {
    // this should be expanded to support more types as needed
    const currentToken = this.peekNextToken();

    switch (currentToken.constructor) {
      case NumberToken:
        return this.parseNumberLiteral();
      case IdentifierToken:
        return this.parseIdentifierExpression();
      case PunctuatorToken:
        switch (currentToken.value) {
          case "(":
            return this.parseParenExpression();
        }
    }
  }

  parseParenExpression() {
    this.validateNextToken("(");
    let tok = this.peekNextToken();

    let expr = this.parseAtomic();

    while (tok.value !== ")") {
      expr = this.parseBinOp(expr, 0);
      tok = this.peekNextToken();
    }

    this.validateNextToken(")");

    return expr;
  }

  parseConditionalBranch() {
    const branchNode = this.sourceGraph.addNode({ type: "conditional_branch" });

    const conditionNode = this.parseIfCondition();

    this.sourceGraph.addEdge(branchNode, conditionNode, "conditions");

    while (true) {
      const nextCondition = this.peekNextToken();
      if (nextCondition && nextCondition.value === "else") {
        this.validateNextToken("else");

        const altIf = this.peekNextToken();

        if (altIf && altIf.value === "if") {
          const conditionNode = this.parseIfCondition();
          this.sourceGraph.addEdge(branchNode, conditionNode, "conditions");
        } else {
          const elseExpr = this.parseElseCondition();
          this.sourceGraph.addEdge(branchNode, elseExpr, "else");
        }
      } else {
        break;
      }
    }

    return branchNode;
  }

  parseDoWhileLoop() {
    this.validateNextToken("do");
    this.validateNextToken("{");

    const loopNode = this.sourceGraph.addNode({ type: "do_while_loop" });

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(loopNode, bodyNode, "body");
    }

    this.validateNextToken("}");
    this.validateNextToken("while");
    this.validateNextToken("(");

    const testExpr = this.parsePrimaryExpression();
    this.sourceGraph.addEdge(loopNode, testExpr, "test");

    this.validateNextToken(")");

    return loopNode;
  }

  parseWhileLoop() {
    this.validateNextToken("while");

    this.validateNextToken("(");

    const testExpr = this.parsePrimaryExpression();

    this.validateNextToken(")");
    this.validateNextToken("{");

    const loopNode = this.sourceGraph.addNode({ type: "while_loop" });

    this.sourceGraph.addEdge(loopNode, testExpr, "test");

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(loopNode, bodyNode, "body");
    }

    this.validateNextToken("}");

    return loopNode;
  }

  parseIfCondition() {
    this.validateNextToken("if");
    this.validateNextToken("(");

    const testExpr = this.parsePrimaryExpression();

    this.validateNextToken(")");
    this.validateNextToken("{");

    const ifNode = this.sourceGraph.addNode({ type: "if_conditional" });

    this.sourceGraph.addEdge(ifNode, testExpr, "test");

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(ifNode, bodyNode, "body");
    }

    this.validateNextToken("}");

    return ifNode;
  }

  parseElseCondition() {
    this.validateNextToken("{");

    const elseNode = this.sourceGraph.addNode({ type: "else_expression" });

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(elseNode, bodyNode, "body");
    }

    this.validateNextToken("}");

    return elseNode;
  }

  // objects
  parseObjectLiteral() {
    this.validateNextToken("{");

    const objNode = this.sourceGraph.addNode({ type: "object_literal" });

    let objTok = this.getNextToken();
    while (objTok.value !== "}") {
      const keyNode = this.sourceGraph.addNode({
        type: "object_key",
        key: objTok.value
      });

      this.validateNextToken(":");

      const valNode = this.parsePrimaryExpression();

      this.sourceGraph.addEdge(keyNode, valNode, "value");
      this.sourceGraph.addEdge(objNode, keyNode, "member");

      objTok = this.getNextToken();
      if (objTok.value === ",") {
        objTok = this.getNextToken();
        continue;
      } else {
        break;
      }
    }

    return objNode;
  }

  // arrays
  parseArrayLiteral() {
    const operator = this.getNextToken();
    const arrayNode = this.sourceGraph.addNode({ type: "array_literal" });

    if (operator.value === "[]") {
      // empty array literal
      return arrayNode;
    }

    // array with members
    let tok = null;

    do {
      const expr = this.parseAtomic();
      if (expr) {
        this.sourceGraph.addEdge(arrayNode, expr, "members");
      }

      tok = this.getNextToken();
    } while (tok.value !== "]");

    return arrayNode;
  }

  // functions

  parseFunctionDeclaration() {
    this.validateNextToken("function");
    const funcIdentifier = this.getNextToken();

    if (!(funcIdentifier instanceof IdentifierToken)) {
      return null;
    }

    let funcNode;
    const args = this.parseFunctionArguments();
    const funcKind = this.parseFunctionType();

    if (funcKind) {
      funcNode = this.sourceGraph.addNode({
        type: "function",
        identifier: funcIdentifier.value,
        kind: funcKind
      });
    } else {
      funcNode = this.sourceGraph.addNode({
        type: "function",
        identifier: funcIdentifier.value
      });
    }

    args.forEach(a => {
      this.sourceGraph.addEdge(funcNode, a, "arguments");
    });

    this.validateNextToken("{");

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(funcNode, bodyNode, "body");
    }

    this.validateNextToken("}");

    return funcNode;
  }

  parseExternalFunctionDefinition() {
    this.validateNextToken("external");
    this.validateNextToken("function");

    const funcIdentifier = this.getNextToken();

    let funcNode;
    const args = this.parseExternalFunctionArguments();
    const funcKind = this.parseExternalFunctionType();

    if (funcKind) {
      funcNode = this.sourceGraph.addNode({
        type: "external_function",
        identifier: funcIdentifier.value,
        kind: funcKind
      });
    } else {
      return null;
    }

    // external functions cannot have a body
    const tok = this.peekNextToken();

    if (tok && tok.value === "{") {
      return null;
    }

    args.forEach(a => {
      this.sourceGraph.addEdge(funcNode, a, "arguments");
    });

    return funcNode;
  }

  parseFunctionType() {
    const token = this.peekNextToken();
    if (token instanceof OperatorToken && token.value === "->") {
      this.validateNextToken("->");

      const typeToken = this.getNextToken();

      return typeToken.value;
    }

    return null;
  }

  parseExternalFunctionType() {
    const token = this.peekNextToken();
    if (token instanceof OperatorToken && token.value === "->") {
      this.validateNextToken("->");

      const typeToken = this.getNextToken();

      // check for indirection
      const pointerTok = this.peekNextToken();
      if (pointerTok instanceof OperatorToken) {
        return {
          type: "pointer",
          kind: typeToken.value,
          indirection: pointerTok.value.length
        };
      }

      return typeToken.value;
    }

    return null;
  }

  parseFunctionInvocation(funcIdentifier) {
    const invokeNode = this.sourceGraph.addNode({
      type: "invocation",
      identifier: funcIdentifier
    });
    const args = this.parseInvocationArguments();

    args.forEach(a => {
      this.sourceGraph.addEdge(invokeNode, a, "arguments");
    });

    return invokeNode;
  }

  parseAnonymousFunction() {
    const funcNode = this.sourceGraph.addNode({ type: "anonymous_function" });
    const args = this.parseFunctionArguments();

    args.forEach(a => {
      this.sourceGraph.addEdge(funcNode, a, "arguments");
    });

    this.validateNextToken("=>");

    this.validateNextToken("{");

    while (true) {
      const bodyNode = this.parsePrimaryExpression();

      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(funcNode, bodyNode, "body");
    }

    this.validateNextToken("}");

    return funcNode;
  }

  parseInstanceExpression() {
    this.validateNextToken("this");
    this.validateNextToken(".");

    const keyExpr = this.parseKeyPath();
    const left = this.sourceGraph.addNode({ type: "instance_reference" });

    this.sourceGraph.addEdge(left, keyExpr, "key_expression");
    let right = null;

    const operator = this.peekNextToken();
    if (operator instanceof OperatorToken) {
      if (operator.value === "=") {
        this.getNextToken(); // consume operator

        const opNode = this.sourceGraph.addNode({
          type: "assignment",
          operator: operator.value
        });

        right = this.parseExpression();

        this.sourceGraph.addEdge(opNode, left, "left");
        this.sourceGraph.addEdge(opNode, right, "right");

        return opNode;
      } else {
        return this.parseBinOp(left, 0); // use `0` as default precedence
      }
    }

    return left;
  }

  // variables
  parseVariableDeclaration() {
    const declarationType = this.getNextToken();

    if (declarationType.value === "const") {
      return this.parseImmutable();
    } else {
      return this.parseMutable();
    }
  }

  parseImmutable() {
    let declareNode = null;
    const nodeType = "immutable_declaration";
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
    this.validateNextToken("=");

    const assignmentExpr = this.parsePrimaryExpression();

    this.sourceGraph.addEdge(declareNode, assignmentExpr, "expression");

    return declareNode;
  }

  parseMutable() {
    let declareNode = null;
    const nodeType = "mutable_declaration";
    const identifier = this.parseIdentifier();

    // require for type annotation, but can also be inferred
    const kind = this.parseType();

    // assignment is optional
    const token = this.peekNextToken();
    if (token instanceof OperatorToken && token.value === "=") {
      this.validateNextToken("=");

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
      this.sourceGraph.addEdge(declareNode, assignmentExpr, "expression");

      return declareNode;
    }

    return this.sourceGraph.addNode({
      type: nodeType,
      kind,
      identifier
    });
  }

  parseType() {
    const token = this.peekNextToken();

    if (token instanceof PunctuatorToken && token.value === ":") {
      this.validateNextToken(":");
      const typeToken = this.getNextToken();

      return typeToken.value;
    }

    return null;
  }

  parseExternalType() {
    const token = this.peekNextToken();

    if (token instanceof PunctuatorToken && token.value === ":") {
      this.validateNextToken(":");
      const typeToken = this.getNextToken();

      if (typeToken instanceof OperatorToken && typeToken.value === "...") {
        return "variadic";
      }

      // check for indirection
      const pointerTok = this.peekNextToken();
      if (pointerTok instanceof OperatorToken) {
        return {
          type: "pointer",
          kind: typeToken.value,
          indirection: pointerTok.value.length
        };
      }

      return typeToken.value;
    }

    return null;
  }

  // classes
  parseClassDefinition() {
    this.validateNextToken("class");
    const className = this.getNextToken();

    // super class
    let superClass = null;
    const token = this.peekNextToken();
    if (token instanceof KeywordToken && token.value === "extends") {
      this.validateNextToken("extends");
      superClass = this.getNextToken().value;
    }

    this.validateNextToken("{");

    const classDef = this.sourceGraph.addNode({
      type: "class_definition",
      identifier: className.value,
      kind: className.value,
      super_class: superClass
    });

    // class body (constructor and methods)
    let tok = this.peekNextToken();

    while (tok.value !== "}") {
      if (tok instanceof KeywordToken) {
        if (tok.value === "const" || tok.value === "let") {
          const ivarExpr = this.parseInstanceVariable();
          this.sourceGraph.addEdge(classDef, ivarExpr, "instance_variables");
        } else if (tok.value === "constructor") {
          const bodyExpr = this.parseClassMethod();
          this.sourceGraph.addEdge(classDef, bodyExpr, "body");
        }
      } else {
        const bodyExpr = this.parseClassMethod();
        this.sourceGraph.addEdge(classDef, bodyExpr, "body");
      }

      tok = this.peekNextToken();
    }

    this.validateNextToken("}");

    return classDef;
  }

  parseInstanceVariable() {
    return this.parseVariableDeclaration();
  }

  parseClassMethod() {
    const methodIdentifier = this.getNextToken();
    let methodType = null;

    if (methodIdentifier instanceof KeywordToken) {
      methodType = "constructor";
    } else if (methodIdentifier instanceof IdentifierToken) {
      methodType = "method";
    } else {
      return null;
    }

    let methodNode = null;

    const args = this.parseFunctionArguments();
    const funcKind = this.parseFunctionType();

    if (funcKind) {
      methodNode = this.sourceGraph.addNode({
        type: methodType,
        identifier: methodIdentifier.value,
        kind: funcKind
      });
    } else {
      methodNode = this.sourceGraph.addNode({
        type: methodType,
        identifier: methodIdentifier.value
      });
    }

    args.forEach(a => {
      this.sourceGraph.addEdge(methodNode, a, "arguments");
    });

    this.validateNextToken("{");

    while (true) {
      const bodyNode = this.parsePrimaryExpression();
      if (!bodyNode) {
        break;
      }

      this.sourceGraph.addEdge(methodNode, bodyNode, "body");
    }

    this.validateNextToken("}");

    return methodNode;
  }

  parseInstantiation() {
    this.validateNextToken("new");
    const classInstance = this.parseIdentifier();

    const instance = this.sourceGraph.addNode({
      type: "instantiation",
      identifier: classInstance
    });

    const instanceArgs = this.parseInvocationArguments();
    instanceArgs.forEach(a => {
      this.sourceGraph.addEdge(instance, a, "arguments");
    });

    return instance;
  }

  parseFunctionArguments() {
    const args = [];

    this.validateNextToken("(");

    let tok = null;

    do {
      let expr;
      tok = this.peekNextToken();

      if (tok instanceof IdentifierToken) {
        const identifier = this.parseIdentifier();
        const kind = this.parseType();

        if (kind) {
          expr = this.sourceGraph.addNode({
            type: "function_argument",
            kind,
            identifier
          });
        } else {
          expr = this.sourceGraph.addNode({
            type: "function_argument",
            identifier
          });
        }
      }

      if (expr) {
        args.push(expr);
      }

      tok = this.getNextToken();
    } while (tok.value !== ")");

    return args;
  }

  parseExternalFunctionArguments() {
    const args = [];

    this.validateNextToken("(");

    let tok = null;

    do {
      let expr;
      tok = this.peekNextToken();

      if (tok instanceof IdentifierToken) {
        const identifier = this.parseIdentifier();
        const kind = this.parseExternalType();

        if (kind) {
          expr = this.sourceGraph.addNode({
            type: "function_argument",
            kind,
            identifier
          });
        } else {
          return null;
        }
      }

      if (expr) {
        args.push(expr);
      }

      tok = this.getNextToken();
    } while (tok.value !== ")");

    return args;
  }

  parseInvocationArguments() {
    const args = [];

    this.validateNextToken("(");

    // array with members
    let tok = null;

    do {
      const expr = this.parseExpression();
      if (expr) {
        args.push(expr);
      }

      tok = this.getNextToken();
    } while (tok.value !== ")");

    return args;
  }

  // return expression
  parseReturnExpression() {
    this.validateNextToken("return");

    const returnExpr = this.sourceGraph.addNode({ type: "return_statement" });
    const expr = this.parseExpression();

    this.sourceGraph.addEdge(returnExpr, expr, "expression");

    return returnExpr;
  }

  // modules

  parseImport() {
    this.validateNextToken("import");

    const imports = [];
    let tok = null;

    do {
      let expr;

      const identifier = this.parseIdentifier();
      expr = this.sourceGraph.addNode({
        type: "import_declaration",
        identifier
      });

      imports.push(expr);

      tok = this.getNextToken();
    } while (tok.value !== "from");

    const modName = this.parseIdentifier();
    const importNode = this.sourceGraph.addNode({
      type: "import_statement",
      identifier: modName
    });

    imports.forEach(i => {
      this.sourceGraph.addEdge(importNode, i, "import");
    });

    return importNode;
  }

  parseExport() {
    this.validateNextToken("export");
    const expr = this.parsePrimaryExpression();

    const exportNode = this.sourceGraph.addNode({ type: "export_statement" });
    this.sourceGraph.addEdge(exportNode, expr, "expression");

    return exportNode;
  }

  // atomics and literals
  parseIdentifier() {
    const identifier = this.getNextToken();
    return identifier.value;
  }

  parseBooleanLiteral() {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({
      type: "boolean_literal",
      kind: "Boolean",
      value: literal.value
    });
  }

  parseNumberLiteral() {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({
      type: "number_literal",
      kind: literal.options.kind,
      value: literal.value
    });
  }

  parseStringLiteral() {
    const literal = this.getNextToken();
    return this.sourceGraph.addNode({
      type: "string_literal",
      kind: "String",
      value: literal.value
    });
  }

  parseIdentifierExpression() {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation
    if (token instanceof PunctuatorToken && token.value === "(") {
      return this.parseFunctionInvocation(identifier);
    } else if (token instanceof OperatorToken && token.value === ".") {
      this.validateNextToken(".");
      const keyExpr = this.parseKeyPath();
      const refExpr = this.sourceGraph.addNode({
        type: "object_reference",
        identifier
      });

      this.sourceGraph.addEdge(refExpr, keyExpr, "key_expression");

      return refExpr;
    } else if (token instanceof OperatorToken && token.value === "[") {
      this.validateNextToken("[");
      const index = this.parseIdentifier();

      this.validateNextToken("]");

      return this.sourceGraph.addNode({
        type: "array_reference",
        identifier,
        index
      });
    }

    return this.sourceGraph.addNode({ type: "variable_reference", identifier });
  }

  parseKeyPath() {
    const identifier = this.parseIdentifier();

    const token = this.peekNextToken();

    // is an invocation of an object key val
    if (token instanceof PunctuatorToken && token.value === "(") {
      return this.parseFunctionInvocation(identifier);
    } else if (token instanceof OperatorToken && token.value === ".") {
      this.validateNextToken(".");
      const keyExpr = this.parseKeyPath();
      const refExpr = this.sourceGraph.addNode({
        type: "object_reference",
        identifier
      });

      this.sourceGraph.addEdge(refExpr, keyExpr, "key_expression");

      return refExpr;
    }

    return this.sourceGraph.addNode({ type: "key_reference", identifier });
  }

  // Helper

  getTokenPrecedence() {
    const operator = this.peekNextToken();
    if (operator) {
      return OP_PRECEDENCE[operator.value] || -1;
    }

    return -1;
  }

  toAST(node) {
    return this.sourceGraph.treeFromNode(node);
  }

  // Tokenizer

  validateNextToken(tokenValue) {
    // interput parsing execution if we find a syntax error
    if (this.getNextToken().value !== tokenValue) {
      throw new Error(`Expected \`${tokenValue}\``);
    }
  }

  getNextToken() {
    const tok = this.tokens[this.pos];
    this.pos++;

    return tok;
  }

  peekNextToken() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }

    return null;
  }

  readTokens() {
    this.tokens = this.lexer.tokenize();
    this.pos = 0;
  }
}

module.exports = Parser;
