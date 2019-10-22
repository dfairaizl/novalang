class Traversal {
  constructor () {
    this.matchedNodes = {};
    this.matchedPaths = [];
  }

  start (node) {
    this.startNode = node;
  }

  direction (d) {
    this.degree = d;
  }

  filter (criteria) {
    this.filters = criteria;
  }

  // BFS collecting all paths
  run (graph, q) {
    // let q = [];

    // if (!this.startNode) {
    //   // no starting point, let's collect all nodes according to the criteria
    //   q = this.findNodes(graph);
    // } else {
    //   q = [[this.startNode]];
    // }

    while (q.length > 0) {
      const path = q.shift();
      const endNode = path[path.length - 1];

      if (this.isDestination(endNode)) {
        this.matchedPaths.unshift(path);
        this.matchedNodes[endNode.id] = endNode;

        continue;
      }

      const neighborsList = graph.adjacencyList[endNode.id].edges;
      neighborsList.forEach((edge) => {
        const target = edge.target;

        if (!path.find((n) => n.id === target.id)) {
          const newPath = path.slice();
          newPath.push(target);
          q.unshift(newPath);
        }
      });

      this.depth++;
    }
  }

  isDestination (node) {
    return Object.entries(this.filters).every(([key, val]) => {
      return node.attributes[key] === val;
    });
  }

  findNodes (graph) {
    const nodes = graph.nodes.filter((node) => {
      return this.isDestination(node);
    });

    this.matchedNodes = nodes;
    this.matchedPaths = nodes.map((node) => [node]);
  }
}

class QueryPlanner {
  constructor (graph) {
    this.graph = graph;
    this.steps = [];
  }

  addStep (step, options) {
    this.steps.push({ type: step, options });
  }

  compile () {
    const stages = [new Traversal()];
    this.steps.forEach((step, index) => {
      let currStage = stages.pop();

      switch (step.type) {
        case 'start':
          currStage.start(step.options);
          break;
        case 'direction':
          currStage.direction(step.options);
          break;
        case 'traversal':
          currStage.maxDepth = step.options;
          break;
        case 'filter':
          currStage.filters = step.options;
          if (index !== this.steps.length - 1) { // FIXME ugly
            stages.push(currStage);
            currStage = new Traversal();
          }
          break;
      }

      stages.push(currStage);
    });

    this.queryStages = stages;
  }

  execute () {
    debugger;
    return this.queryStages.reduce((paths, stage) => {
      if (stage.startNode) {
        paths.push([stage.startNode]);
      } else if (!stage.startNode && paths.length === 0) {
        // this condition could be done in a better way
        stage.findNodes(this.graph);
        return stage.matchedPaths;
      }

      stage.run(this.graph, paths);
      return stage.matchedPaths; // mutated in-place from the accumulator in this reduce
    }, []);
  }

  // get paths () {
  //   console.log(require('util').inspect(this.queryStages, { depth: null }));
  //   return this.queryStages.map((stage) => {
  //     return stage.matchedPaths;
  //   })[0]; // FIXME
  // }

  get nodes () {
    return this.queryStages.reduce((nodes, stage) => {
      Object.values(stage.matchedNodes).forEach((n) => nodes.push(n));
      return nodes;
    }, []);
  }
}

class Query {
  constructor (graph, options) {
    this.graph = graph;
    this.planner = new QueryPlanner(graph);
  }

  begin (startNode) {
    this.planner.addStep('start', startNode);

    return this;
  }

  // right now the ASG is a DAG
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

module.exports = Query;
