const Graph = require('../compiler/graph/graph');

// const g = new Graph();
//
// // create graph https://www.geeksforgeeks.org/wp-content/uploads/graph.png
// // DFS = "5 2 3 1 0 4"
//
// const nA = g.addNode({ name: 'A' });
// const nT = g.addNode({ name: 'T' });
// const nB = g.addNode({ name: 'B' });
// const nC = g.addNode({ name: 'C' });
// const nD = g.addNode({ name: 'D' });
// const nE = g.addNode({ name: 'E' });
//
// g.addEdge(nA, nB);
// g.addEdge(nA, nC);
// g.addEdge(nA, nT);
// g.addEdge(nB, nD);
// g.addEdge(nC, nB);
// g.addEdge(nC, nE);
// g.addEdge(nE, nD);
// g.addEdge(nT, nB);
//
// const dfs = g.traverse(nA);
// const postorder = dfs.postOrder();
//
// postorder.reverse().forEach((n) => {
//   console.log(n.attributes.name);
// });

const program = new Graph();

const mod = program.addNode({ type: 'module' });
const funcA = program.addNode({ type: 'Func A' });
const funcB = program.addNode({ type: 'Func B' });
const funcC = program.addNode({ type: 'Func C' });
const num = program.addNode({ type: 'int' });
const num2 = program.addNode({ type: 'int2' });
const invoke = program.addNode({ type: 'invocation' });

program.addEdge(mod, funcA);
program.addEdge(mod, funcB);

program.addEdge(funcB, num);
program.addEdge(funcB, funcC);
program.addEdge(funcC, num2);

program.addEdge(mod, invoke);

const t = program.traverse(num);
const postOrderNodes = t.postOrder();

program.traverse(postOrderNodes[0], 2).forEach((n) => {
  console.log(n.attributes.type);
});
