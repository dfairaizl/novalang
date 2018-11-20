class Node {
  constructor (name, type) {
    this.name = name;
    this.type = type;
    this.inEdge = null;
    this.outEdges = [];

    // meta
    this.visited = false;
  }

  addIncoming (node) {
    this.inEdge = node;
  }

  addOutgoing (node) {
    this.outEdges.push(node);
  }

  toString () {
    return this.name;
  }
}

/*
  const name = "dan";

  func sayHiToDan() {
    const greeting = "hello" + " " + name;
    return greeting;
  }

  func addTwo() {
    const a = 1;
    const b = 2;

    reutrn a + b;
  }

            a(module) -- b(var)
             /    \
      f(func)     c(func)
       / \           /  \
  g(var) h(var)  d(var) e(ref b)

*/

const a = new Node('a', 'module');
const b = new Node('b', 'var');
const c = new Node('c', 'func');
const d = new Node('d', 'var');
const e = new Node('e', 'varRef');
const f = new Node('f', 'func');
const g = new Node('g', 'var');
const h = new Node('h', 'var');

a.addOutgoing(b);
b.addIncoming(a);

a.addOutgoing(c);
c.addIncoming(a);

c.addOutgoing(d);
d.addIncoming(c);
c.addOutgoing(e);
e.addIncoming(c);

a.addOutgoing(f);
f.addIncoming(a);

f.addOutgoing(g);
g.addIncoming(g);
f.addOutgoing(h);
h.addIncoming(f);

// traverse via DFS
function traverse (node, depth = 1, maxDepth = 1) {
  if (!node || node.visited) {
    return;
  }

  console.log('Visited', node.name);
  node.visited = true;

  if (depth <= maxDepth) {
    node.outEdges.map((n) => {
      traverse(n, depth + 1, maxDepth);
    });
  } else {
    return node;
  }

  // go up
  traverse(node.inEdge, depth, maxDepth);
}

traverse(c); // get nodes in this closure
