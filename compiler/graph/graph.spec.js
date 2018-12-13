/* global describe, it, expect */

const Edge = require('./edge');
const Graph = require('./graph');

describe('Graph', () => {
  it('creates a graph with empty node and edge lists', () => {
    const graph = new Graph();

    expect(graph.adjacencyList).toBeDefined();
  });

  describe('nodes', () => {
    it('can add nodes', () => {
      const graph = new Graph();

      const node = graph.addNode({ name: 'node 1' });

      expect(node).toBeDefined();
      expect(graph.nodeFor(node.id)).toBeDefined();
      expect(graph.nodeFor(node.id).attributes).toMatchObject({ name: 'node 1' });
    });

    it('can add a node twice and not duplicate it', () => {
      const graph = new Graph();

      const node = graph.addNode({ name: 'node 1' });
      const dupNode = graph.addNode({ name: 'node 1' }, node.id);

      expect(Object.values(graph.adjacencyList).length).toBe(1);
      expect(node).toEqual(dupNode);
    });
  });

  describe('edges', () => {
    it('can add edges to connect nodes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      graph.addEdge(node1, node2);
      const adjList = graph.adjacencyList[node1.id];

      expect(adjList).toBeDefined();
      expect(adjList.edges[0]).toBeDefined();
      expect(adjList.edges[0]).toBeInstanceOf(Edge);
    });

    it('can add edges with arbitrary labels', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      graph.addEdge(node1, node2, 'connectedTo');
      const edges = graph.adjacencyList[node1.id].edges;

      expect(edges[0].label).toBe('connectedTo');
    });

    it('can add edges with arbitrary weights', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });

      graph.addEdge(node1, node2, 'connectedTo', 100);
      const edges = graph.adjacencyList[node1.id].edges;

      expect(edges[0].weight).toBe(100);
    });

    it('cannot add edge to only one node', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });

      graph.addEdge(node1, null);

      expect(graph.adjacencyList[node1.id].edges.length).toBe(0);
    });
  });
});
