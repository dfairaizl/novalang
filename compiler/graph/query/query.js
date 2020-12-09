class NodeNotFoundError extends Error {}
class InvalidTraversalError extends Error {}
class InvalidCriteriaError extends Error {}

class QueryContext {
  constructor() {
    this.contextStack = [];
    this.current = -1;
  }

  addExecution() {
    const exec = new ExecutionStage();

    if (this.contextStack[this.current]) {
      const cExec = this.contextStack[this.current];
      exec.nodes = cExec.results;
    }

    exec.status = "pending";
    this.contextStack.push(exec);
    this.current++;

    return exec;
  }
}

class ExecutionStage {
  constructor() {
    this.results = new Set();
  }

  add(node) {
    this.results.add(node);
  }
}

class Query {
  constructor(graph) {
    this.graph = graph;

    this.queryContext = new QueryContext();
    this.execution = this.queryContext.addExecution();
  }

  find(node, meta) {
    if (this.execution.status === "complete") {
      throw new InvalidTraversalError("`Find` can only start a query");
    }

    this.execution.operation = "lookup";
    this.execution.criteria = { id: node.id };
    this.execution.metadata = meta;

    if (!this.graph.adjacencyList[node.id]) {
      throw new NodeNotFoundError(
        "Error: Starting node is not present in graph"
      );
    }

    this.execution.add(node);

    this.execution.status = "complete";

    return this;
  }

  match(criteria, meta) {
    if (this.execution.status === "complete") {
      throw new InvalidTraversalError("`Match` can only start a query");
    }

    this.execution.operation = "search";
    this.execution.criteria = criteria;
    this.execution.metadata = meta;

    if (this.execution.criteria) {
      const matchedNodes = this.graph.nodes.filter((node) => {
        return Object.entries(criteria).every(([k, v]) => {
          return node.attributes[k] === v;
        });
      });

      matchedNodes.forEach((n) => {
        this.execution.add(n);
      });
    }

    this.execution.status = "complete";

    return this;
  }

  out(label, meta) {
    this.execution = this.queryContext.addExecution();
    this.execution.operation = "outgoing_traversal";
    this.execution.label = label;
    this.execution.metadata = meta;

    this.execution.nodes.forEach((node) => {
      this.graph.outgoing(node, label).forEach((outNode) => {
        this.execution.add(outNode);
      });
    });

    this.execution.status = "complete";

    return this;
  }

  in(label, meta) {
    this.execution = this.queryContext.addExecution();
    this.execution.operation = "incoming_traversal";
    this.execution.label = label;
    this.execution.metadata = meta;

    this.execution.nodes.forEach((node) => {
      this.graph.incoming(node, label).forEach((outNode) => {
        this.execution.add(outNode);
      });
    });

    this.execution.status = "complete";

    return this;
  }

  until(criteria, meta) {
    let traversalDirection = this.execution.operation;
    let traversalInFlgiht = true;

    while (traversalInFlgiht) {
      let traversalStage = this.execution;
      let stagedNodes = traversalStage.results;

      this.execution = this.queryContext.addExecution();
      this.execution.operation = "repeating_traversal";
      this.execution.metadata = meta;
      this.execution.results = traversalStage.results;

      if (this.checkCriteria([...stagedNodes], criteria)) {
        this.execution.status = "complete";

        return this;
      } else {
        if (traversalDirection === "outgoing_traversal") {
          this.out(null, meta);
        } else {
          this.in(null, meta);
        }
      }
    }

    this.execution.status = "complete";

    return this;
  }

  search(criteria, meta) {
    const visited = {};
    const queue = [...this.execution.results];

    this.execution = this.queryContext.addExecution();
    this.execution.operation = "bfs";
    this.execution.criteria = criteria;
    this.execution.metadata = meta;

    while (queue.length) {
      const node = queue.pop();

      // visit the node
      visited[node.id] = true;

      // check if node is a destination
      const isDest = Object.entries(criteria).every(([k, v]) => {
        return node.attributes[k] === v;
      });

      if (isDest) {
        this.execution.add(node);
      }

      // add neighbors
      this.graph.outgoing(node).forEach((n) => {
        if (!visited[n.id]) {
          queue.unshift(n);
        }
      });
    }

    this.execution.status = "complete";

    return this;
  }

  where(criteria, meta) {
    if (!criteria) {
      throw new InvalidCriteriaError();
    }

    let traversalStage = this.execution;
    let stagedNodes = [...traversalStage.results];

    this.execution = this.queryContext.addExecution();
    this.execution.operation = "filter";
    this.execution.criteria = criteria;
    this.execution.metadata = meta;

    const result = stagedNodes.filter((node) => {
      return Object.entries(criteria).every(([k, v]) => {
        return node.attributes[k] === v;
      });
    });

    this.execution.results = result;
    this.execution.status = "complete";

    return this;
  }

  checkCriteria(nodes, criteria) {
    const filteredNodes = nodes.filter((node) => {
      return Object.entries(criteria).every(([k, v]) => {
        return node.attributes[k] === v;
      });
    });

    return filteredNodes.length;
  }

  returns(bindings) {
    let queryBindings = [];

    if (Array.isArray(bindings)) {
      queryBindings = bindings;
    } else {
      queryBindings = [bindings];
    }

    const boundStages = queryBindings.reduce((boundsVars, binding) => {
      const returnStage = this.queryContext.contextStack.reduce(
        (nodes, stage) => {
          if (stage.metadata && stage.metadata.name === binding) {
            [...stage.results].forEach((n) => nodes.add(n));
          }

          return nodes;
        },
        new Set()
      );

      boundsVars[binding] = [...returnStage];

      return boundsVars;
    }, {});

    return boundStages;
  }

  returnAll() {
    const nodes = new Set();

    this.queryContext.contextStack.forEach((stage) => {
      stage.results.forEach((n) => nodes.add(n));
    });

    return [...nodes];
  }
}

module.exports = Query;

module.exports.NodeNotFoundError = NodeNotFoundError;
module.exports.InvalidTraversalError = InvalidTraversalError;
