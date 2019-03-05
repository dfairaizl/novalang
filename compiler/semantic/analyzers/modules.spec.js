/* global describe, it, expect */

const { resolve } = require('path');
const { readFileSync } = require('fs');

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  ReassignImmutableError
} = require('../errors');


// readFileSync in the nova IO lib
const file = readFileSync(resolve(__dirname, '..', '..', 'library', 'io', 'io.nv'));
const ioFile = file.toString('utf8');

const parser = new Parser(ioFile);
const libIO = parser.parse();

// library IO {
//   external function printf(format: char *, ...args) -> Int;
// }

describe('Module Analyzer', () => {
  describe('value assignments', () => {
    it('allows functions from the standard library to be imported', () => {
      // have parser run in a beforeEach or something and parse the actual stdlib code
      // then have the semantic analyzer ensure cross module dependencies are
      // actually defined, then we can do type checking and function checking later on
      const parser = new Parser(`
        const io = require('io');
        io('hello world');
      `);

      const sourceGraph = parser.parse();

      sourceGraph.merge(libIO);

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      sourceGraph.debug();

      expect(() => true).toBe(false);
    });
  });
});
