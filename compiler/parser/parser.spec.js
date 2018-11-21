/* global describe, it, expect */

const Parser = require('.');
const {
  VariableNode
} = require('../graph/nodes');

describe('closures', () => {
  it('creates a global closure to hold variables', () => {
    const parser = new Parser('const x = 1; const y = x');

    const xVar = parser.parse(); // const x = 1
    const yVar = parser.parse();

    const closure = yVar.scope().filterFor(VariableNode);

    expect(closure).toEqual([yVar, xVar]);
  });
});
