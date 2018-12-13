/* global describe, it, expect */

const Parser = require('.');

describe('closures', () => {
  it.skip('creates a global closure to hold variables', () => {
    const parser = new Parser('const x = 1; const y = x');
  });
});
