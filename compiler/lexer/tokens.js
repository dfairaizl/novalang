class Token {
  constructor (value) {
    this.value = value;
  }
}

class IdentifierToken extends Token {}
class KeywordToken extends Token {}
class NumberToken extends Token {}
class OperatorToken extends Token {}
class PunctuatorToken extends Token {}

module.exports = {
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken
};
