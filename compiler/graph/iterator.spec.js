/* global describe, it, expect */

const Graph = require('./graph');

describe('Graph Iterator', () => {
  describe('depth-first search traversal', () => {
    it('visits all nodes only once', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);
      graph.addEdge(node2, node3);

      const iterator = graph.traverse(null);
      const nodes = iterator.iterate(null);

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });

    it('visits all nodes adjacent to starting point', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addNode({ name: 'node 4' }); // extra node to not be visted

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);

      const iterator = graph.traverse(null);
      const nodes = iterator.iterate(node1);

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });

    it('visits all nodes up to max depth', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);

      const iterator = graph.traverse(null);
      const nodes = iterator.iterate(node1, 1);

      expect(nodes).toEqual([
        node1,
        node2
      ]);
    });
  });

  describe('breadth-first search traversal', () => {
    it.only('visits all nodes only once', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);
      graph.addEdge(node2, node3);

      const iterator = graph.traverse(null);
      const nodes = iterator.query(null);

      expect(nodes).toEqual([
        node1,
        node2,
        node3
      ]);
    });
  });
});
