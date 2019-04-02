/* global describe, it, expect */

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  InvalidExportError,
  ReassignImmutableError
} = require('../errors');

describe('Expression Analyzer', () => {
  describe('value assignments', () => {
    it('checks for assignments to immutable variables', () => {
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

  describe('module exports', () => {
    it('allows functions to be exported', () => {
      const parser = new Parser(`export function add(x: Int, y: Int) -> Int {}`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).not.toThrowError(InvalidExportError);
    });

    it('throws an error for invalid exports', () => {
      const parser = new Parser(`export 3.14`);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).toThrowError(InvalidExportError);
    });
  });
});
