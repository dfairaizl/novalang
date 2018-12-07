const Graph = require('../compiler/graph/graph');

const program = new Graph();

const mod = program.addNode({ type: 'module' });
const funcA = program.addNode({ type: 'Func A' });
const funcB = program.addNode({ type: 'Func B' });
const float1 = program.addNode({ type: 'float' });
const funcC = program.addNode({ type: 'Func C' });
const num = program.addNode({ type: 'int' });
const num2 = program.addNode({ type: 'int2' });
const invoke = program.addNode({ type: 'invocation' });

program.addEdge(mod, funcA);
program.addEdge(mod, funcB);
program.addEdge(mod, funcC);

program.addEdge(funcB, num);
program.addEdge(funcB, float1);
program.addEdge(funcB, funcC);
program.addEdge(funcC, num2);

program.addEdge(mod, invoke);

const t = program.traverse(num2);

t.sorted().forEach((n) => {
  n.outEdges().forEach((i) => {
    console.log(i.target.attributes.type);
  });
});
