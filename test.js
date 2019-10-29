const Parser = require('./compiler/parser');
const Analyzer = require('./compiler/semantic');

const parser = new Parser(`
  function one(x: Int) -> Int { return one(1) }
`);

const sourceGraph = parser.parse();

const semanticAnalyzer = new Analyzer(sourceGraph);
semanticAnalyzer.analyze();
