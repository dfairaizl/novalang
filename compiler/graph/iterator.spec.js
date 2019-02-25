/* global describe, it, expect */

const Graph = require('./graph');

describe('Graph Iterator', () => {
  describe('recursive depth-first search traversal', () => {
    it('visits all nodes', () => {
      const graph = new Graph();
      const nodes = [];

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);

      const iterator = graph.traverse(null);
      iterator.iterate((n) => {
        nodes.push(n);
      });

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });

    it('visits all nodes only once', () => {
      const graph = new Graph();
      const nodes = [];

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);
      graph.addEdge(node2, node3);

      const iterator = graph.traverse(null);
      iterator.iterate((n) => {
        nodes.push(n);
      });

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });

    it('visits all nodes adjacent to starting point', () => {
      const graph = new Graph();
      const nodes = [];

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);

      const iterator = graph.traverse(null);
      iterator.iterate(node1, (n) => {
        nodes.push(n);
      });

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });
  });
});
