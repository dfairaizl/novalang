/* global describe, it, expect */

const Graph = require('./graph');

describe('Directed Graph', () => {
  it('creates a graph with empty node and edge lists', () => {
    const graph = new Graph();

    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
  });

  describe('nodes', () => {
    it('can add nodes', () => {
      const graph = new Graph();

      const node = graph.addNode({ name: 'node 1' });

      expect(node).toBeDefined();
      expect(graph.nodes[node.id]).toBeDefined();
      expect(graph.nodes[node.id].attributes).toMatchObject({ name: 'node 1' });
    });

    it('can add a node twice', () => {
      const graph = new Graph();

      const node = graph.addNode({ name: 'node 1' });
      const dupNode = graph.addNode({ name: 'node 1' }, node.id);

      expect(Object.values(graph.nodes).length).toBe(1);
      expect(node).toEqual(dupNode);
    });
  });

  describe('edges', () => {
    it('can add edges to connect nodes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      const edge = graph.addEdge(node1, node2);

      expect(edge).toBeDefined();
    });

    it('can add edges with arbitrary weights', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      const edge = graph.addEdge(node1, node2, 12);

      expect(edge.weight).toBe(12);
    });

    it('can add edges with arbitrary attributes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      const edge = graph.addEdge(node1, node2, { name: 'edge1' });

      expect(edge.attributes).toMatchObject({ name: 'edge1' });
    });

    it('can add edges with arbitrary weight and attributes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      const edge = graph.addEdge(node1, node2, 20, { name: 'edge1' });

      expect(edge.weight).toBe(20);
      expect(edge.attributes).toMatchObject({ name: 'edge1' });
    });

    it('add edge to source and target node', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      const edge = graph.addEdge(node1, node2);

      expect(node1.edges).toEqual([edge]);
      expect(node2.edges).toEqual([edge]);
    });

    it('cannot add edge to only one node', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });

      const edge = graph.addEdge(node1, null);

      expect(edge).toBe(null);
    });
  });

  describe('depth-first search traversal', () => {
    it.only('visits all nodes', () => {
      const graph = new Graph();
      const nodes = [];

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);

      const iterator = graph.traverse(null);
      iterator.forEach(false, (n) => {
        nodes.push(n);
      });

      expect(nodes.length).toBe(3);
    });

    it('visits all nodes adjacent to starting point', () => {
      const graph = new Graph();
      const nodes = [];

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);

      const iterator = graph.traverse(node1);

      iterator.forEach((n) => {
        nodes.push(n);
      });

      expect(nodes.length).toBe(2);
    });

    it('visits all adjacent nodes respecting specified depth', () => {
      const graph = new Graph();
      const nodes = [];

      /*
           (a)
           /\
        (b)  (c)
              /\
           (d) (e)
      */

      const nodeA = graph.addNode({ name: 'a' });
      const nodeB = graph.addNode({ name: 'b' });
      const nodeC = graph.addNode({ name: 'c' });
      const nodeD = graph.addNode({ name: 'd' });
      const nodeE = graph.addNode({ name: 'e' });

      graph.addEdge(nodeA, nodeB);
      graph.addEdge(nodeA, nodeC);
      graph.addEdge(nodeC, nodeD);
      graph.addEdge(nodeC, nodeE);

      const iterator = graph.traverse(nodeA, 1);

      iterator.forEach((n) => {
        nodes.push(n);
      });

      expect(nodes).toEqual([nodeB, nodeC]);
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
