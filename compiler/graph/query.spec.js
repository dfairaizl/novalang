/* global describe, it, expect */

const Graph = require('./graph');

describe('Graph Query', () => {
  describe('finds paths by attributes', () => {
    it('finds paths that match criteria', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ type: 'person' });
      const node2 = graph.addNode({ type: 'person' });
      graph.addNode({ type: 'animal' });

      graph.addEdge(node1, node2);

      const q = graph.query();

      q.match({ type: 'person' }).execute();

      expect(q.paths()).toEqual([
        [node1, node2],
        [node1]
      ]);
    });
  });

  describe('finds matchings nodes by attributes in a path', () => {
    it('finds paths that match criteria', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ type: 'person' });
      const node2 = graph.addNode({ type: 'person' });
      graph.addNode({ type: 'animal' });

      graph.addEdge(node1, node2);

      const q = graph.query();

      q.match({ type: 'person' }).execute();

      expect(q.nodes()).toEqual([node1, node2]);
    });

    it('returns all matching nodes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });
      const node5 = graph.addNode({ name: 'node 5' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);
      graph.addEdge(node4, node5);

      const q = graph.query();

      q.begin(node1)
        .outgoing()
        .any({ maxDepth: 2 })
        .match({ name: 'node 3' })
        .outgoing()
        .any({ maxDepth: 2 })
        .match({ name: 'node 5' })
        .execute();

      expect(q.nodes()).toEqual([node3, node5]);
    });
  });

  describe('path queries', () => {
    it('finds a path from a start node to an end node', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);

      const q = graph.query();

      q.begin(node1)
        .outgoing()
        .any({ maxDepth: 3 })
        .match({ name: 'node 4' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node2, node3, node4]
      ]);
    });

    it('finds all paths from a start node to an end node', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });

      //   / 2 \
      // 1      4
      //   \ 3 /

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);
      graph.addEdge(node2, node4);
      graph.addEdge(node3, node4);

      const q = graph.query();

      q.begin(node1)
        .outgoing()
        .any({ maxDepth: 3 })
        .match({ name: 'node 4' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node2, node4],
        [node1, node3, node4]
      ]);
    });

    it('finds all paths from a start node to matching end nodes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'end node' });
      const node5 = graph.addNode({ name: 'end node' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);
      graph.addEdge(node3, node5);

      const q = graph.query();

      q.begin(node1)
        .outgoing()
        .any({ maxDepth: 3 })
        .match({ name: 'end node' })
        .execute();

      expect(q.paths()[0]).toEqual([node1, node2, node3, node4]);
      expect(q.paths()[1]).toEqual([node1, node2, node3, node5]);
    });
  });

  describe('multi-stage queries', () => {
    it.only('finds a path with multiple traversal conditions', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'node 1' });
      const node2 = graph.addNode({ name: 'node 2' });
      const node3 = graph.addNode({ name: 'node 3' });
      const node4 = graph.addNode({ name: 'node 4' });
      const node5 = graph.addNode({ name: 'node 5' });

      graph.addEdge(node1, node2);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);
      graph.addEdge(node4, node5);

      const q = graph.query();

      q.begin(node1)
        .outgoing()
        .any({ maxDepth: 2 })
        .match({ name: 'node 3' })
        .outgoing()
        .any({ maxDepth: 2 })
        .match({ name: 'node 5' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node2, node3, node4, node5]
      ]);
    });
  });
});
