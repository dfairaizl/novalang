/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  ReassignImmutableError
} = require('../errors');

describe('Expression Analyzer', () => {
  describe('value assignments', () => {
    it('checks for assignments to immnutable variables', () => {
      const parser = new Parser(`const x = 1; x = 2;`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).toThrowError(ReassignImmutableError);
    });

    it('checks for assignments to mutable variables', () => {
      const parser = new Parser(`let x = 1; x = 2;`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(ReassignImmutableError);
    });
  });
});