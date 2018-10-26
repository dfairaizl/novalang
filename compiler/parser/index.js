const Lexer = require('../lexer');

class Parser {
  constructor (options) {
    this.options = options || {};
    this.lexer = null;
  }

  parse (input) {
    this.lexer = new Lexer(input);

    this.readTokens();
  }

  parsePrimary () {
    if (this.currentToken === 'function') {
      console.log('parsing function declaration');
      return this.parseFunctionDeclaration();
    }
  }

  parseFunctionDeclaration () {
    const funcName = this.getNextToken();

    if (this.getNextToken() !== '(') {
      return null;
    }

    const args = [];

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

    if (this.getNextToken() !== '{') {
      return null;
    }

    // TODO: parse function body as primary

    if (this.getNextToken() !== '}') {
      return null;
    }

    return {
      name: funcName,
      args
    };
  }

  getNextToken () {
    this.pos++;
    return this.tokens[this.pos];
  }

  readTokens () {
    this.tokens = this.lexer.tokenize();
    this.pos = 0;
  }
}

module.exports = Parser;
