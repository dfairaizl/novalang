const QueryPlanner = require('./planner');

class QueryBuilder {
  constructor (graph, options) {
    this.graph = graph;
    this.planner = new QueryPlanner(graph);
  }

  begin (startNode) {
    this.planner.addStep('start', startNode);

    return this;
  }

  outgoing () {
    this.planner.addStep('direction', 'out');

    return this;
  }

  match (conditions) {
    this.planner.addStep('filter', conditions);

    return this;
  }

  any (options) {
    this.planner.addStep('traversal', options);

    return this;
  }

  nodes () {
    return this.planner.nodes;
  }

  paths () {
    return this.matchedPaths;
  }

  execute () {
    this.planner.compile();
    this.matchedPaths = this.planner.execute();

    return this;
  }
}

module.exports = QueryBuilder;
