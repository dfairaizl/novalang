const QueryPlanner = require("./planner");
const QueryEngine = require("../execution/engine");

class QueryBuilder {
  constructor(graph, options) {
    this.graph = graph;
    this.planner = new QueryPlanner(graph);
  }

  // basic executions
  match(conditions) {
    this.planner.addNodeFilter(conditions);

    return this;
  }

  begin(startNode) {
    this.planner.addStartNode(startNode);

    return this;
  }

  matchAll() {
    this.planner.addNodeFilter(null); // no filter

    return this;
  }

  // path finding
  outgoing(relation) {
    this.planner.addEdgeFilter(relation);

    return this;
  }

  // execution

  execute() {
    const engine = new QueryEngine(this.graph, this.planner.ast);
    this.result = engine.executeQuery();
  }

  nodes() {
    let nodes = [];

    this.result.paths.forEach(p => {
      p.nodes.forEach(n => nodes.push(n));
    });

    return nodes;
  }

  // begin (startNode) {
  //   this.planner.addStep('start', startNode);
  //
  //   return this;
  // }
  //
  // outgoing (label) {
  //   this.planner.addStep('direction', { degree: 'out', label });
  //
  //   return this;
  // }
  //
  // match (conditions) {
  //   this.planner.addStep('filter', conditions);
  //
  //   return this;
  // }
  //
  // matchAll () {
  //   this.planner.addStep('match_all');
  //
  //   return this;
  // }
  //
  // any (options) {
  //   this.planner.addStep('traversal', options);
  //
  //   return this;
  // }
  //
  // nodes () {
  //   return this.planner.nodes;
  // }
  //
  // paths () {
  //   return this.planner.paths;
  // }
  //
  // execute () {
  //   this.planner.compile();
  //   this.planner.execute();
  //
  //   return this;
  // }
}

module.exports = QueryBuilder;
