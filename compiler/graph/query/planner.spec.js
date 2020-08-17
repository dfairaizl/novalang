/* global describe, it, expect */

const Graph = require("../graph");

describe("Graph Query Planner", () => {
  describe("language", () => {
    it("plans basic queries", () => {
      const graph = new Graph();

      const q = graph.query();

      q.match({ type: "person" });

      expect(q.planner.ast).toMatchSnapshot();
    });

    it("plans basic queries to traverse nodes", () => {
      const graph = new Graph();

      const q = graph.query();

      q.match({ type: "person" }).outgoing("friends");

      expect(q.planner.ast).toMatchSnapshot();
    });
  });
});
