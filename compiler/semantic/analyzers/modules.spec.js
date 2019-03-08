/* global describe, beforeEach, it, expect */

const { resolve } = require('path');
const { readFileSync } = require('fs');

const Parser = require('../../parser');
const Analyzer = require('..');
const {
  ImportNotFoundError,
  InvalidExportError,
  ModuleNotFound
} = require('../errors');

const file = readFileSync(resolve(__dirname, '..', '..', 'library', 'io.nv'));
const ioFile = file.toString('utf8');

let libIO = null;

describe('Module Analyzer', () => {
  beforeEach(() => {
    const parser = new Parser(ioFile, 'io');
    libIO = parser.parse();
  });

  describe('import declarations', () => {
    it('throws an error if module is not found', () => {
      const parser = new Parser(`
        import printf from 'stdio';
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).toThrowError(ModuleNotFound);
    });

    it('checks a single function imported from other modules', () => {
      const parser = new Parser(`
        import printf from 'io';
        printf('test')
      `);

      const sourceGraph = parser.parse();

      sourceGraph.merge(libIO);

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const ref = sourceGraph.search('import_declaration');

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', name: 'printf' } }
      ]);
    });

    it('checks multiple functions imported from other modules', () => {
      const parser = new Parser(`
        import printf, scanf from 'io';
      `);

      const sourceGraph = parser.parse();

      sourceGraph.merge(libIO);

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const ref = sourceGraph.search('import_declaration');

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', name: 'printf' } }
      ]);

      expect(sourceGraph.relationFromNode(ref[1], 'binding')).toMatchObject([
        { attributes: { type: 'external_function', name: 'scanf' } }
      ]);
    });

    it('throws an error if import not found in module', () => {
      const parser = new Parser(`
        import fopen from 'io';
      `);

      const sourceGraph = parser.parse();

      sourceGraph.merge(libIO);

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).toThrowError(ImportNotFoundError);
    });
  });

  describe('export statements', () => {
    it('throws an error if a function is not exported', () => {
      const parser = new Parser(`
        export const x = 1;
      `);

      const sourceGraph = parser.parse();

      const semanticAnalyzer = new Analyzer(sourceGraph);

      expect(() => semanticAnalyzer.analyze()).toThrowError(InvalidExportError);
    });
  });
});
