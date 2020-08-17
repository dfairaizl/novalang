const Traversal = require("./traversal");
const Path = require("./path");

// ////////////////////////////////////////////////////////////////////////////

class MatchNode {
  constructor() {
    this.algorithm = "search";
    this.children = [];
    this.nodeFilters = {};
  }

  filterNodes(attrs) {
    if (attrs) {
      this.nodeFilters = attrs;
    }
  }
}

class TraversalNode {
  constructor(edgeFilter) {
    this.algorithm = "bfs";
    this.children = [];

    this.edgeFilter = edgeFilter;
  }
}

// ////////////////////////////////////////////////////////////////////////////

class QueryAST {
  createSearchRoot() {
    this.head = new MatchNode();

    return this.head;
  }

  addChild(astNode) {
    this.head.children.push(astNode);
  }
}

// ////////////////////////////////////////////////////////////////////////////

class QueryPlanner {
  constructor() {
    this.ast = new QueryAST();
    this.current = this.ast.head;
  }

  addNodeFilter(conditions) {
    if (!this.current) {
      this.createSearch();
    }

    this.current.filterNodes(conditions);
  }

  addEdgeFilter(edgeRelation) {
    // this.current.filterEdges(edgeRelation);
    this.createTraversal(edgeRelation);
  }

  createSearch() {
    this.current = this.ast.createSearchRoot();
  }

  createTraversal(edgeRelation) {
    this.current = this.ast.addChild(new TraversalNode(edgeRelation));
  }

  // addStep (step, options) {
  //   this.steps.push({ type: step, options });
  // }
  //
  // compile () {
  //   const stages = [new Traversal()];
  //
  //   this.steps.forEach((step, index) => {
  //     let currStage = stages.pop();
  //
  //     switch (step.type) {
  //       case 'start':
  //         currStage.start(step.options);
  //         break;
  //       case 'direction':
  //         currStage.direction(step.options);
  //         break;
  //       case 'traversal':
  //         currStage.configure(step.options);
  //         break;
  //       case 'match_all':
  //         currStage.filters = null; // clear any filters on this stage so all nodes match
  //
  //         if (index !== this.steps.length - 1) { // FIXME ugly
  //           stages.push(currStage);
  //           currStage = new Traversal();
  //         }
  //         break;
  //       case 'filter':
  //         currStage.filters = step.options;
  //
  //         if (index !== this.steps.length - 1) { // FIXME ugly
  //           stages.push(currStage);
  //           currStage = new Traversal();
  //         }
  //         break;
  //     }
  //
  //     stages.push(currStage);
  //   });
  //
  //   this.queryStages = stages;
  // }
  //
  // execute () {
  //   const matchedPaths = this.queryStages.reduce((paths, stage) => {
  //     if (stage.startNode) {
  //       paths.push(new Path(stage.startNode, stage.options));
  //     } else if (!stage.startNode && paths.length === 0) {
  //       // this condition could be done in a better way
  //       stage.findNodes(this.graph);
  //       return stage.matchedPaths;
  //     }
  //
  //     stage.run(this.graph, paths);
  //
  //     return stage.matchedPaths; // mutated in-place from the accumulator in this reduce
  //   }, []);
  //
  //   this.matchedPaths = matchedPaths;
  // }
  //
  // get nodes () {
  //   return this.queryStages.reduce((nodes, stage) => {
  //     Object.values(stage.matchedNodes).forEach((n) => nodes.push(n));
  //     return nodes;
  //   }, []);
  // }
  //
  // get paths () {
  //   return this.matchedPaths.map((path) => path.path);
  // }
}

module.exports = QueryPlanner;
