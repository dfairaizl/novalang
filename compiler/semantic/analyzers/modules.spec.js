/* global describe, it, expect */

const { resolve } = require('path');
const { readFileSync } = require('fs');

const Parser = require('../../parser');
const Analyzer = require('..');

const file = readFileSync(resolve(__dirname, '..', '..', 'library', 'io', 'io.nv'));
const ioFile = file.toString('utf8');

const parser = new Parser(ioFile, 'io');
const libIO = parser.parse();

// library IO {
//   external function printf(format: char *, ...args) -> Int;
// }

describe('Module Analyzer', () => {
  describe('value assignments', () => {
    it('allows functions from the standard library to be imported', () => {
      const parser = new Parser(`
        const printf = require('io');
        printf('hello world');
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
