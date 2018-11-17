const { readFileSync } = require('fs');
const { resolve } = require('path');
const Parser = require('../compiler/parser');

const example = readFileSync(resolve(__dirname, './function.nv'));
const parser = new Parser();
parser.parse(example.toString());

while (true) {
  const expr = parser.parsePrimaryExpression();
  if (!expr) {
    break;
  }

  console.log(expr);
}
