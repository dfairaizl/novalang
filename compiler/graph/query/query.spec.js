/* global describe, it, expect */

const Graph = require('../graph');

describe('Graph Query', () => {
  describe('nodes', () => {
    it('finds nodes matching the criteria', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ type: 'person' });
      const node2 = graph.addNode({ type: 'person' });
      graph.addNode({ type: 'animal' });

      graph.addEdge(node1, node2);

      const q = graph.query();

      q.match({ type: 'person' }).execute();

      expect(q.nodes()).toEqual([node1, node2]);
    });

    it('finds all nodes', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ type: 'person' });
      const node2 = graph.addNode({ type: 'person' });
      const node3 = graph.addNode({ type: 'animal' });

      graph.addEdge(node1, node2);

      const q = graph.query();

      q.matchAll().execute();

      expect(q.nodes()).toEqual([node1, node2, node3]);
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
        .any()
        .match({ name: 'node 3' })
        .outgoing()
        .any()
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
        .any()
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
        .any()
        .match({ name: 'node 4' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node3, node4],
        [node1, node2, node4]
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
        .any()
        .match({ name: 'end node' })
        .execute();

      expect(q.paths()[0]).toEqual([node1, node2, node3, node4]);
      expect(q.paths()[1]).toEqual([node1, node2, node3, node5]);
    });

    it('finds all paths when max depth is not exceeded', () => {
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
        .any({ maxDepth: 4 })
        .match({ name: 'node 4' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node2, node3, node4]
      ]);
    });

    it('finds no paths when max depth is exceeded', () => {
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
        .match({ name: 'node 5' })
        .execute();

      expect(q.paths()).toEqual([]);
    });
  });

  describe('matching criteria', () => {
    it('finds nodes with mathing criteria using AND boolean logic', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ type: 'person', name: 'Dan' });
      const node2 = graph.addNode({ type: 'person', name: 'Arthur' });
      graph.addNode({ type: 'animal' });

      graph.addEdge(node1, node2);

      const q = graph.query();

      q.match({ type: 'person', name: 'Arthur' }).execute();

      expect(q.nodes()).toEqual([node2]);
    });
  });

  describe('labeled edge queries', () => {
    it('follows only edges with the specified label', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ type: 'person', name: 'Arthur' });
      const node2 = graph.addNode({ type: 'person', name: 'Dan' });
      const node3 = graph.addNode({ type: 'person', name: 'Juli' });

      graph.addEdge(node1, node2, 'dada');
      graph.addEdge(node1, node3, 'mama');

      const q = graph.query();

      q.begin(node1)
        .outgoing('dada')
        .matchAll()
        .execute();

      expect(q.nodes()).toEqual([node2]);
    });
  });

  describe('multi-stage queries', () => {
    it('finds a path with multiple traversal conditions', () => {
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
        .any()
        .match({ name: 'node 3' })
        .outgoing()
        .any()
        .match({ name: 'node 5' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node2, node3, node4, node5]
      ]);
    });
  });

  describe('limiting depth', () => {
    it('returns no matching paths when max depth is exceeded', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'first' });
      const node2 = graph.addNode({ name: 'first' });
      const node3 = graph.addNode({ name: 'second' });
      const node4 = graph.addNode({ name: 'third' });
      const node5 = graph.addNode({ name: 'fourth' });

      //
      //  first \
      //         second - third - fourth
      //  first /
      //

      graph.addEdge(node1, node3);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);
      graph.addEdge(node4, node5);

      const q = graph.query();

      q.match({ name: 'first' })
        .outgoing()
        .any({ maxDepth: 1 })
        .match({ name: 'third' })
        .execute();

      expect(q.paths()).toEqual([]);
    });

    it('only finds matching paths that do not exceed max depth', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'first' });
      const node2 = graph.addNode({ name: 'first' });
      const node3 = graph.addNode({ name: 'second' });
      const node4 = graph.addNode({ name: 'third' });
      const node5 = graph.addNode({ name: 'fourth' });

      //
      //  first ---------\
      //         second - third - fourth
      //  first /
      //

      graph.addEdge(node1, node4);
      graph.addEdge(node2, node3);
      graph.addEdge(node3, node4);
      graph.addEdge(node4, node5);

      const q = graph.query();

      q.match({ name: 'first' })
        .outgoing()
        .any({ maxDepth: 1 })
        .match({ name: 'third' })
        .execute();

      expect(q.paths()).toEqual([
        [node1, node4]
      ]);
    });

    it('finds paths to nodes when no end criteria is defined', () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: 'first' });
      const node2 = graph.addNode({ name: 'second' });
      const node3 = graph.addNode({ name: 'third' });
      const node4 = graph.addNode({ name: 'fourth' });

      graph.addEdge(node1, node2);
      graph.addEdge(node1, node3);
      graph.addEdge(node3, node4);

      const q = graph.query();

      q.match({ name: 'first' })
        .outgoing()
        .any({ maxDepth: 1 })
        .matchAll()
        .execute();

      expect(q.paths()).toEqual([
        [node1, node2],
        [node1, node3]
      ]);
    });
  });
});
