class Iterator {
  constructor (graph, options) {
    this.graph = graph;
    this.options = {
      order: 'preorder',
      ...options
    };

    this.visitCache = {};
  }

  dfs (source, depth, maxDepth, visited, path) {
    visited[source.id] = true;

    // we've searched the entire graph, FIXME and memoize or something
    if (path.length === this.graph.nodes.length) {
      return true;
    }

    if (depth >= maxDepth) {
      return true;
    }

    const neighborsList = this.graph.adjacencyList[source.id].edges;
    neighborsList.forEach((edge) => {
      if (!visited[edge.target.id]) {
        path.push(edge.target);

        return this.dfs(edge.target, ++depth, maxDepth, visited, path);
      }

      return false;
    });
  }

  bfs (visited, frontier, path) {
    while (frontier.length > 0) {
      const v = frontier.pop();
      path.push(v);

      const neighborsList = this.graph.adjacencyList[v.id].edges;
      neighborsList.forEach((edge) => {
        if (!visited[edge.target.id]) {
          visited[edge.target.id] = true;
          frontier.unshift(edge.target);
        }
      });
    }
  }

  iterate (entryNode = null, depth = 100) {
    // no entry node, traverse all nodes in the graph
    if (entryNode === null) {
      entryNode = this.graph.nodes[0];
    }

    let path = [entryNode];
    let visited = {};

    this.dfs(entryNode, 0, depth, visited, path);

    return path;
  }

  query (entryNode = null, depth = 100) {
    // no entry node, traverse all nodes in the graph
    if (entryNode === null) {
      entryNode = this.graph.nodes[0];
    }

    let path = [];
    let visited = {};

    this.bfs(visited, [entryNode], path);

    return path;
  }
}

module.exports = Iterator;
