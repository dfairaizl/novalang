class Iterator {
  constructor (graph, options) {
    this.graph = graph;
    this.options = {
      order: 'preorder',
      ...options
    };

    this.visitCache = {};
  }

  dfs (source, level, currentLevel, visited, path) {
    console.log(currentLevel, level);
    if (currentLevel >= level) {
      console.log('up');
      return true;
    }

    // we've searched the entire graph, FIXME and memoize or something
    if (path.length === this.graph.nodes.length) {
      return true;
    }

    if (visited[source.id]) {
      return false;
    }

    visited[source.id] = true;

    const neighborsList = this.graph.adjacencyList[source.id].edges;
    neighborsList.forEach((edge) => {
      // self pointing?

      const seen = visited[edge.target.id];
      if (!seen) {
        path.push(edge.target);

        console.log(path);
        if (this.dfs(edge.target, level, ++currentLevel, visited, path)) {
          console.log('done');
          return true;
        }

        path.pop();
      }

      visited[source.id] = null;
      return false;
    });
  }

  iterate (entryNode = null, depth = 100) {
    // no entry node, traverse all nodes in the graph
    if (entryNode === null) {
      entryNode = this.graph.nodes[0];
    }

    let path = [entryNode];
    let visited = {};

    this.dfs(entryNode, depth, 0, visited, path);

    return path;
  }
}

module.exports = Iterator;
