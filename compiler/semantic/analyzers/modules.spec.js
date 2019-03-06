/* global describe, beforeEach, it, expect */

const { resolve } = require('path');
const { readFileSync } = require('fs');

const Parser = require('../../parser');
const Analyzer = require('..');

const file = readFileSync(resolve(__dirname, '..', '..', 'library', 'io', 'io.nv'));
const ioFile = file.toString('utf8');

let libIO = null;

// library IO {
//   external function printf(format: char *, ...args) -> Int;
// }

describe('Module Analyzer', () => {
  beforeEach(() => {
    const parser = new Parser(ioFile, 'io');
    libIO = parser.parse();
  });

  describe('import declarations', () => {
    it.only('checks a single function imported from other modules', () => {
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
        { attributes: { type: 'function', name: 'printf' } }
      ]);
    });

    it('checks multiple functions imported from other modules', () => {
      const parser = new Parser(`
        import printf, readLine from 'io';
      `);

      const sourceGraph = parser.parse();

      sourceGraph.merge(libIO);

      const semanticAnalyzer = new Analyzer(sourceGraph);
      semanticAnalyzer.analyze();

      const ref = sourceGraph.search('import_declaration');

      expect(sourceGraph.relationFromNode(ref[0], 'binding')).toMatchObject([
        { attributes: { type: 'function', name: 'printf' } }
      ]);

      expect(sourceGraph.relationFromNode(ref[1], 'binding')).toMatchObject([
        { attributes: { type: 'function', name: 'readLine' } }
      ]);
    });
  });
});
