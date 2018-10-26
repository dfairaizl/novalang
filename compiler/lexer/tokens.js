class Token {
  constructor (value) {
    this.value = value;
  }
}

class IdentifierToken extends Token {}
class NumberToken extends Token {}
class OperatorToken extends Token {}
class PunctuatorToken extends Token {}

module.exports = {
  IdentifierToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
};
