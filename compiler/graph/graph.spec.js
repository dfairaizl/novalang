/* global describe, it, expect */

const Edge = require("./edge");
const Graph = require("./graph");

describe("Graph", () => {
  it("is created with empty node and edge lists", () => {
    const graph = new Graph();

    expect(graph.adjacencyList).toBeDefined();
  });

  describe("nodes", () => {
    it("can be created", () => {
      const graph = new Graph();

      const node = graph.addNode();

      expect(node).toBeDefined();
      expect(graph.adjacencyList[node.id].node).toBeDefined();
    });

    it("can be created with custom identifiers", () => {
      const graph = new Graph();

      const node = graph.addNode({ name: "node 1" }, "node-ident-1");

      expect(node).toBeDefined();
      expect(graph.adjacencyList["node-ident-1"].node).toBeDefined();
    });

    it("can add nodes with empty attributes", () => {
      const graph = new Graph();

      const node = graph.addNode();

      expect(node).toBeDefined();
      expect(graph.adjacencyList[node.id].node).toBeDefined();
      expect(graph.adjacencyList[node.id].node.attributes).toEqual({});
    });

    it("can add nodes with empty attributes", () => {
      const graph = new Graph();

      const node = graph.addNode({ name: "test1" });

      expect(node).toBeDefined();
      expect(graph.adjacencyList[node.id].node).toBeDefined();
      expect(graph.adjacencyList[node.id].node.attributes).toEqual({
        name: "test1",
      });
    });

    it("cannot be added twice with the same id", () => {
      const graph = new Graph();

      const node = graph.addNode({ name: "node 1" });
      const dupNode = graph.addNode({ name: "node 1" }, node.id);

      expect(Object.values(graph.adjacencyList).length).toBe(1);
      expect(node).toEqual(dupNode);
    });

    it("can be returned", () => {
      const graph = new Graph();

      graph.addNode({ name: "node 1" });
      graph.addNode({ name: "node 2" });

      expect(graph.nodes.length).toBe(2);
    });

    it("can return nodes from outgoing edges", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });
      const node2 = graph.addNode({ name: "node 2" });

      graph.addEdge(node1, node2, "connection");

      expect(graph.outgoing(node1)).toEqual([node2]);
    });

    it("can return nodes from incoming edges", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });
      const node2 = graph.addNode({ name: "node 2" });

      graph.addEdge(node1, node2, "connection");

      expect(graph.incoming(node2)).toEqual([node1]);
    });

    it("can be returned from outgoing edges with labels", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "module" });
      const node2 = graph.addNode({ name: "const" });
      const node3 = graph.addNode({ name: "function" });

      graph.addEdge(node1, node2, "source");
      graph.addEdge(node1, node3, "source");

      expect(graph.outgoing(node1, "source")).toEqual([node2, node3]);
    });

    it("can be returned from incoming edges with labels", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "module" });
      const node2 = graph.addNode({ name: "const" });
      const node3 = graph.addNode({ name: "function" });

      graph.addEdge(node1, node2, "source");
      graph.addEdge(node1, node3, "source");

      expect(graph.incoming(node2, "source")).toEqual([node1]);
    });
  });

  describe("edges", () => {
    it("can be returned", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });
      const node2 = graph.addNode({ name: "node 2" });

      graph.addEdge(node1, node2);

      expect(graph.edges.length).toBe(1);
    });

    it("can be created between two nodes", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });
      const node2 = graph.addNode({ name: "node 2" });

      graph.addEdge(node1, node2);

      expect(graph.edges.length).toBe(1);
    });

    it("can be created with arbitrary labels", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });
      const node2 = graph.addNode({ name: "node 2" });

      graph.addEdge(node1, node2, "connectedTo");
      const edges = graph.adjacencyList[node1.id].edges;

      expect(edges[0].label).toBe("connectedTo");
    });

    it("can be created with arbitrary weights", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });
      const node2 = graph.addNode({ name: "node 2" });

      graph.addEdge(node1, node2, "connectedTo", 100);
      const edges = graph.adjacencyList[node1.id].edges;

      expect(edges[0].weight).toBe(100);
    });

    it("cannot be added to only one node", () => {
      const graph = new Graph();

      const node1 = graph.addNode({ name: "node 1" });

      graph.addEdge(node1, null);

      expect(graph.adjacencyList[node1.id].edges.length).toBe(0);
    });
  });
});
