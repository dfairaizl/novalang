const Traversal = require('./traversal');
const Path = require('./path');

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
          currStage.configure(step.options);
          break;
        case 'match_all':
          currStage.filters = null; // clear any filters on this stage so all nodes match
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
    const matchedPaths = this.queryStages.reduce((paths, stage) => {
      if (stage.startNode) {
        paths.push(new Path(stage.startNode, stage.options));
      } else if (!stage.startNode && paths.length === 0) {
        // this condition could be done in a better way
        stage.findNodes(this.graph);
        return stage.matchedPaths;
      }

      stage.run(this.graph, paths);

      return stage.matchedPaths; // mutated in-place from the accumulator in this reduce
    }, []);

    this.matchedPaths = matchedPaths;
  }

  get nodes () {
    return this.queryStages.reduce((nodes, stage) => {
      Object.values(stage.matchedNodes).forEach((n) => nodes.push(n));
      return nodes;
    }, []);
  }

  get paths () {
    return this.matchedPaths.map((path) => path.path);
  }
}

module.exports = QueryPlanner;
