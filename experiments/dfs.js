const Graph = require('../compiler/graph/graph');

const g = new Graph();

// create graph https://www.geeksforgeeks.org/wp-content/uploads/graph.png
// DFS = "5 2 3 1 0 4"

const n0 = g.addNode({ name: '0' });
const n1 = g.addNode({ name: '1' });
const n2 = g.addNode({ name: '2' });
const n3 = g.addNode({ name: '3' });
const n4 = g.addNode({ name: '4' });
const n5 = g.addNode({ name: '5' });

g.addEdge(n5, n0);
g.addEdge(n5, n2);
g.addEdge(n2, n3);
g.addEdge(n3, n1);
g.addEdge(n4, n0);
g.addEdge(n4, n1);

const dfs = g.traverse(n5);
dfs.forEach((n) => {
  console.log(n.attributes.name);
});
