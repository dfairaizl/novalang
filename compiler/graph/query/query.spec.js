/* global describe, it, expect */

const Graph = require("../graph");
const Node = require("../node");
const Query = require("./query");
const {
  NodeNotFoundError,
  InvalidTraversalError,
  InvalidCriteriaError,
} = require("./query");

describe("Query", () => {
  describe("execution engine", () => {
    describe("find", () => {
      it("throws an error when node is not present in a graph", () => {
        const graph = new Graph();
        const node = new Node();

        const q = new Query(graph);

        expect(() => {
          q.find(node, { name: "first" }).returnAll();
        }).toThrow(NodeNotFoundError);
      });

      it("can find a node in the graph", () => {
        const graph = new Graph();

        const node = graph.addNode({ type: "Human" });

        const q = new Query(graph);

        expect(q.find(node, { name: "first" }).returnAll()).toEqual([node]);
      });

      it("can find a node in the graph and return it", () => {
        const graph = new Graph();

        const node = graph.addNode({ type: "Human" });

        const q = new Query(graph);

        expect(q.find(node, { name: "first" }).returns("first")).toEqual({
          first: [node],
        });
      });

      it("throws an error when `find` is not the first stage of a query", () => {
        const graph = new Graph();
        const node = new Node();

        const q = new Query(graph);

        expect(() => {
          q.match().find(node, { name: "first" }).returnAll();
        }).toThrow(InvalidTraversalError);
      });
    });

    describe("match", () => {
      it("can not return nodes not matched in graph", () => {
        const graph = new Graph();
        graph.addNode({ type: "Human" });

        const q = new Query(graph);
        const result = q
          .match({ type: "Dog" }, { name: "human" })
          .returns("human");

        expect(result.human).toEqual([]);
      });

      it("can find a node in the graph", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human" });

        const q = new Query(graph);
        const result = q
          .match({ type: "Human" }, { name: "human" })
          .returns("human");

        expect(result.human).toEqual([node1]);
      });

      it("can find multiple nodes in the graph", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human" });
        const node2 = graph.addNode({ type: "Human" });

        const q = new Query(graph);
        const result = q
          .match({ type: "Human" }, { name: "humans" })
          .returns("humans");

        expect(result.humans).toEqual([node1, node2]);
      });

      it("can find multiple nodes in the graph by specific criteria", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human", name: "Dan" });
        graph.addNode({ type: "Human", name: "Juli" });

        const q = new Query(graph);
        const result = q
          .match({ type: "Human", name: "Dan" }, { name: "d" })
          .returns("d");

        expect(result.d).toEqual([node1]);
      });

      it("throws an error when `match` is not the first stage of a query", () => {
        const graph = new Graph();
        const node1 = graph.addNode({ type: "Human" });

        const q = new Query(graph);

        expect(() => {
          q.find(node1, { name: "first" }).match(null).returnAll();
        }).toThrow(InvalidTraversalError);
      });
    });

    describe("out", () => {
      it("can find nodes in the graph with outgoing relationships", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });

        graph.addEdge(node1, node2, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node1)
          .out(null, { name: "relatives" })
          .returns("relatives");

        expect(result.relatives).toEqual([node2]);
      });

      it("can find nodes in the graph with labeled outgoing relationships", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });

        graph.addEdge(node1, node2, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node1)
          .out("related_to", { name: "relatives" })
          .returns("relatives");

        expect(result.relatives).toEqual([node2]);
      });

      it("can traverse multiple outgoing relationships", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });
        const node3 = graph.addNode({ type: "Human 3" });
        const node4 = graph.addNode({ type: "Human 4" });

        graph.addEdge(node1, node2, "related_to");
        graph.addEdge(node2, node3, "related_to");
        graph.addEdge(node3, node4, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node1)
          .out()
          .out()
          .out(null, { name: "relative" })
          .returns("relative");

        expect(result.relative).toEqual([node4]);
      });
    });

    describe("in", () => {
      it("can find nodes in the graph with incoming relationships", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });

        graph.addEdge(node1, node2, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node2)
          .in(null, { name: "relatives" })
          .returns("relatives");

        expect(result.relatives).toEqual([node1]);
      });

      it("can find nodes in the graph with labeled outgoing relationships", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });

        graph.addEdge(node1, node2, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node2)
          .in("related_to", { name: "relatives" })
          .returns("relatives");

        expect(result.relatives).toEqual([node1]);
      });

      it("can traverse multiple outgoing relationships", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });
        const node3 = graph.addNode({ type: "Human 3" });
        const node4 = graph.addNode({ type: "Human 4" });

        graph.addEdge(node1, node2, "related_to");
        graph.addEdge(node2, node3, "related_to");
        graph.addEdge(node3, node4, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node4)
          .in()
          .in()
          .in(null, { name: "relative" })
          .returns("relative");

        expect(result.relative).toEqual([node1]);
      });
    });

    describe("until", () => {
      it("can repeat outoing traversals until criteria is met", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });
        const node3 = graph.addNode({ type: "Human 3" });
        const node4 = graph.addNode({ type: "Human 4" });

        graph.addEdge(node1, node2, "related_to");
        graph.addEdge(node2, node3, "related_to");
        graph.addEdge(node3, node4, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node1, { name: "start" })
          .out()
          .until({ type: "Human 4" }, { name: "distant_relative" })
          .returns(["start", "distant_relative"]);

        expect(result.distant_relative).toEqual([node2, node3, node4]);
      });

      it("can repeat incoming traversals until criteria is met", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });
        const node3 = graph.addNode({ type: "Human 3" });
        const node4 = graph.addNode({ type: "Human 4" });

        graph.addEdge(node1, node2, "related_to");
        graph.addEdge(node2, node3, "related_to");
        graph.addEdge(node3, node4, "related_to");

        const q = new Query(graph);
        const result = q
          .find(node4, { name: "end" })
          .in()
          .until({ type: "Human 1" }, { name: "distant_relative" })
          .returns(["start", "distant_relative"]);

        expect(result.distant_relative).toEqual([node3, node2, node1]);
      });
    });

    describe("where", () => {
      it("can collect nodes at a given traversal stage", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human 1" });
        const node2 = graph.addNode({ type: "Human 2" });
        const node3 = graph.addNode({ type: "Human 3" });
        const node4 = graph.addNode({ type: "Human 4" });

        graph.addEdge(node1, node2, "related_to");
        graph.addEdge(node1, node3, "related_to");
        graph.addEdge(node3, node4, "related_to");

        const q = new Query(graph);

        expect(() => {
          q.find(node1)
            .out()
            .where(null, { name: "children" })
            .returns("children");
        }).toThrow(InvalidCriteriaError);
      });

      it("can filter nodes at a given traversal stage", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human" });
        const node2 = graph.addNode({ type: "Human" });
        const node3 = graph.addNode({ type: "Dog" });
        const node4 = graph.addNode({ type: "Cat" });

        graph.addEdge(node1, node2, "related_to");
        graph.addEdge(node1, node3, "pet_to");
        graph.addEdge(node1, node4, "pet_to");

        const q = new Query(graph);
        const result = q
          .find(node1)
          .out("pet_to")
          .where({ type: "Dog" }, { name: "pets" })
          .returns("pets");

        expect(result.pets).toEqual([node3]);
      });
    });

    describe("stages", () => {
      it("can return nodes at different stages of a query", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human", name: "Dan" });
        const node2 = graph.addNode({ type: "Human", name: "Juli" });

        graph.addEdge(node1, node2);

        const q = new Query(graph);

        expect(
          q
            .match({ type: "Human", name: "Dan" }, { name: "d" })
            .out(null, { name: "j" })
            .returns(["d", "j"])
        ).toEqual({ d: [node1], j: [node2] });
      });

      it.skip("can return empty if there are no results for a stage", () => {
        const graph = new Graph();

        const node1 = graph.addNode({ type: "Human", name: "Dan" });
        const node2 = graph.addNode({ type: "Human", name: "Juli" });

        graph.addEdge(node1, node2);

        const q = new Query(graph);

        expect(
          q
            .match({ type: "Animal", name: "Oliver" }, { name: "d" })
            .out()
            .returns(["d", "j"])
        ).toEqual({ d: [], j: [node2] });
      });
    });
  });
});
