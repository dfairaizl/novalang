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

  describe('iterative depth-first search traversal', () => {
    it('visits all nodes', () => {
      const graph = new Graph();
      const nodes = [];

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);

      const iterator = graph.traverse(null);
      iterator.forEach((n) => {
        nodes.push(n);
      });

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });

    it('allows mutation of a node', () => {
      const graph = new Graph();

      graph.addNode({ name: 'node 1' });

      const iterator = graph.traverse(null);
      iterator.forEach((n) => {
        n.attributes.name = 'test 1';
        return n;
      });

      expect(graph.nodes[0].attributes.name).toBe('test 1');
    });
  });
});
