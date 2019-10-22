class QueryStage {
  constructor () {
    this.startNode = null;
    this.degree = 'out';
    this.filters = {};

    this.maxDepth = 1;
    this.depth = 0;
  }
}

class Traversal {
  constructor (graph, options) {
    this.graph = graph;

    const s = new QueryStage();
    this.stages = [s];
    this.stageIndex = 0;
    // this.currentStage = s;
    // this.stageHead = s;
  }

  start (node) {
    // const stage = new QueryStage();
    this.currentStage.startNode = node;
    // this.stages.push(stage);
    // this.currentStage = stage;
  }

  direction (d) {
    if (!this.currentStage) {
      const next = new QueryStage();
      this.stages.push(next);
    }

    this.currentStage.degree = d;
  }

  filter (criteria) {
    this.currentStage.filters = criteria;
    // this.filters.push(this.currentFilters);
    // this.currentFilters = criteria;
  }

  commitStage () {
    if (this.currentStage !== null) {
      // const next = new QueryStage();
      //
      // this.stages.push(next);
      this.stageIndex++;
    }
  }

  // BFS collecting all paths
  run () {
    debugger;
    // reset stages
    this.stageIndex = 0;

    console.log(require('util').inspect(this.stages, { depth: null }));

    if (!this.currentStage.startNode) {
      this.currentStage.startNode = this.graph.nodes[0];
    }

    const q = [[this.currentStage.startNode]];
    const matchedPaths = [];

    while (q.length > 0) {
      const path = q.shift();
      const endNode = path[path.length - 1];

      if (this.isDestination(endNode)) {
        matchedPaths.unshift(path);
        this.nextStage();
        this.currentStage.depth++;
        continue;
      }

      const neighborsList = this.graph.adjacencyList[endNode.id].edges;
      neighborsList.forEach((edge) => {
        const target = edge.target;

        if (!path.find((n) => n.id === target.id)) {
          const newPath = path.slice();
          newPath.push(target);
          q.unshift(newPath);
        }
      });

      this.nextStage();
      if (!this.currentStage) {
        break;
      }

      this.currentStage.depth++;
    }

    console.log(require('util').inspect(matchedPaths, { depth: null }));
    return matchedPaths;
  }

  isDestination (node) {
    return Object.entries(this.currentStage.filters).every(([key, val]) => {
      return node.attributes[key] === val;
    });
  }

  nextStage () {
    if (this.currentStage.depth >= this.currentStage.maxDepth) {
      this.stageIndex++;
    }
  }

  get currentStage () {
    return this.stages[this.stageIndex];
  }
}

class Query {
  constructor (graph, options) {
    this.graph = graph;

    this.traversal = new Traversal(graph);
  }

  begin (startNode) {
    this.traversal.start(startNode);

    return this;
  }

  // right now the ASG is a DAG
  outgoing () {
    this.traversal.direction('out');

    return this;
  }

  match (conditions) {
    this.traversal.filter(conditions);

    this.traversal.commitStage();

    return this;
  }

  nodes () {
    // collect all the nodes in the paths
    const nodes = {};
    this.matchedPaths.forEach((path) => {
      path.forEach((n) => {
        nodes[n.id] = n;
      });
    });

    return Object.values(nodes).filter((node) => {
      let stageIndex = 0;
      let stage = this.traversal.stages[stageIndex];

      while (stage) {
        if (Object.keys(stage.filters).length > 0) {
          const pass = Object.entries(stage.filters).every(([key, val]) => {
            return node.attributes[key] === val;
          });

          if (pass) {
            return node;
          }
        }

        stage = this.traversal.stages[stageIndex++];
      }
    });
  }

  any (options) {
    if (options.maxDepth) {
      this.traversal.currentStage.maxDepth = options.maxDepth;
    }

    return this;
  }

  paths () {
    return this.matchedPaths;
  }

  execute () {
    this.matchedPaths = this.traversal.run();

    return this;
  }
}

module.exports = Query;
