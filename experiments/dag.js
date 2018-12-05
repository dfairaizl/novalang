const Graph = require('../compiler/graph/graph');

const g = new Graph();

// create graph https://www.geeksforgeeks.org/wp-content/uploads/graph.png
// DFS = "5 2 3 1 0 4"

const nA = g.addNode({ name: 'A' });
const nT = g.addNode({ name: 'T' });
const nB = g.addNode({ name: 'B' });
const nC = g.addNode({ name: 'C' });
const nD = g.addNode({ name: 'D' });
const nE = g.addNode({ name: 'E' });

g.addEdge(nA, nB);
g.addEdge(nA, nC);
g.addEdge(nA, nT);
g.addEdge(nB, nD);
g.addEdge(nC, nB);
g.addEdge(nC, nE);
g.addEdge(nE, nD);
g.addEdge(nT, nB);

const dfs = g.traverse(nA);
dfs.forEach((n) => {
  console.log(n.attributes.name);
});
