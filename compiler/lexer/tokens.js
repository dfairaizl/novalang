class Token {
  constructor (value) {
    this.value = value;
  }
}

class IdentifierToken extends Token {}

module.exports = {
  IdentifierToken
};
