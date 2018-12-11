/* global describe, it, expect */

const Graph = require('./graph');

describe('Graph Iterator', () => {
  describe.only('depth-first search traversal', () => {
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

  describe('topographical sorting', () => {
    it('returns null when no starting point is given', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);

      const iterator = graph.traverse(); // start at the "bottom"
      const postOrderNodes = iterator.postOrder();

      expect(postOrderNodes).toBe(null);
    });

    it('sorts nodes from top down', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);

      const iterator = graph.traverse(node4); // start at the "bottom"
      const postOrderNodes = iterator.postOrder();

      expect(postOrderNodes.length).toBe(4);
      expect(postOrderNodes).toEqual([node1, node2, node3, node4]);
    });
  });
});
