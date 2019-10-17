class Traversal {
  constructor (graph, options) {
    this.graph = graph;

    this.degree = 'out';
    this.maxDepth = 15; // hops from start
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
  run () {
    if (!this.startNode) {
      this.startNode = this.graph.nodes[0];
    }

    const q = [[this.startNode]];
    const matchedPaths = [];

    while (q.length > 0) {
      const path = q.shift();
      const endNode = path[path.length - 1];

      if (this.isDestination(endNode)) {
        matchedPaths.unshift(path);
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
    }

    return matchedPaths;
  }

  isDestination (node) {
    return Object.entries(this.filters).every(([key, val]) => {
      return node.attributes[key] === val;
    });
  }
}

class Query {
  constructor (graph, options) {
    this.graph = graph;
    this.queryCriteria = [];

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

    return this;
  }

  execute () {
    return this.traversal.run();
  }
}

module.exports = Query;
