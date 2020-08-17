class QueryPath {
  constructor(startNode) {
    this.depth = 1; // ?
    this.nodes = [startNode];
  }

  addNode(node) {
    this.nodes.push(node);
    this.depth++;
  }
}

class QueryResult {
  constructor() {
    this.paths = [];
  }

  addPath(startNode) {
    this.paths.push(new QueryPath(startNode));
  }
}

class QueryEngine {
  constructor(graph, queryAST) {
    this.graph = graph;
    this.queryAST = queryAST;

    this.matches = [];
  }

  executeQuery(astChild, result) {
    let queryResult = result || null;
    const head = astChild || this.queryAST.head;

    switch (head.algorithm) {
      case "search":
        queryResult = this.search(head);
        break;
      case "bfs":
        queryResult = this.bfs(head, queryResult);
        break;
      default:
        throw new Error(`Unknown execution algorithm \`${head.algorithm}\``);
    }

    head.children.forEach(child => {
      queryResult = this.executeQuery(child, queryResult);
    });

    return queryResult;
  }

  search(queryNode) {
    const nodeFilters = queryNode.nodeFilters;

    let nodes = [];

    nodes = this.graph.nodes.filter(n => {
      return Object.entries(nodeFilters).every(([k, v]) => {
        return n.attributes[k] === v;
      });
    });

    const result = new QueryResult();

    nodes.forEach(n => result.addPath(n));

    return result;
  }

  bfs(queryNode, result) {
    const edgeFilter = queryNode.edgeFilter;
    const queryResult = new QueryResult();
    const q = result.paths;

    while (q.length > 0) {
      const path = q.shift();

      const node = path.nodes[path.nodes.length - 1];

      const neighborsList = this.graph.adjacencyList[node.id].edges;
      neighborsList.forEach(edge => {
        if (edge.label === edgeFilter) {
          path.addNode(edge.target);
          queryResult.paths.push(path);

          q.unshift(path);
        }
      });
    }

    return queryResult;
  }
}

module.exports = QueryEngine;
