/* global describe, it, expect */

const {
  DirectedGraph,
  Node
} = require('./digraph');

describe('Directed Graph', () => {
  it('iterates all direct children in a scope', () => {
    const graph = new DirectedGraph();

    /*
           a(module)
              /\
        b(var)  c(var)
    */
    const a = new Node('a', 'module');
    const b = new Node('b', 'var');
    const c = new Node('c', 'var');

    a.addOutgoing(b);
    a.addOutgoing(c);

    expect(graph.traverse(a).results).toEqual([a, b, c]);
  });

  it('iterates does not return nodes at depth greater than 1 level', () => {
    const graph = new DirectedGraph();

    /*
           a(module)
              /\
        b(var)  c(expr)
                  /\
            d(var)  e(var)
    */
    const a = new Node('a', 'module');
    const b = new Node('b', 'var');
    const c = new Node('c', 'var');
    const d = new Node('d', 'var');
    const e = new Node('e', 'var');

    a.addOutgoing(b);
    a.addOutgoing(c);

    c.addOutgoing(d);
    c.addOutgoing(e);

    expect(graph.traverse(a).results).toEqual([a, b, c]);
  });

  it('iterates direct nodes of the its parent', () => {
    const graph = new DirectedGraph();

    /*
           a(module) - d(var)
              /\
        b(var)  c(var) <--- start here at `c`
    */
    const a = new Node('a', 'module');
    const b = new Node('b', 'var');
    const c = new Node('c', 'var');
    const d = new Node('d', 'var');

    a.addOutgoing(b);
    a.addOutgoing(c);
    a.addOutgoing(d);

    expect(graph.traverse(c).results).toEqual([c, a, b, d]);
  });
});
