class Token {
  constructor (value) {
    this.value = value;
  }
}

class BooleanToken extends Token {}
class IdentifierToken extends Token {}
class KeywordToken extends Token {}
class NumberToken extends Token {}
class OperatorToken extends Token {}
class PunctuatorToken extends Token {}
class StringToken extends Token {}

module.exports = {
  BooleanToken,
  IdentifierToken,
  KeywordToken,
  NumberToken,
  OperatorToken,
  PunctuatorToken,
  StringToken
};
