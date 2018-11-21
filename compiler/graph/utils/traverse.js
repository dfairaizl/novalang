class QueryResult {
  constructor () {
    this.results = [];
  }

  filterFor (type) {
    return this.results.filter(n => n instanceof type);
  }

  addResult (r) {
    this.results.push(r);
  }

  combine (set) {
    set.results.forEach((r) => this.results.push(r));
    return this;
  }
}

function traverse (node, depth = 1, maxDepth = 1) {
  let collectedNodes = new QueryResult();
  if (!node || node.visited) {
    return collectedNodes;
  }

  node.visited = true;
  collectedNodes.addResult(node);

  if (depth <= maxDepth) {
    node.outEdges.forEach((n) => {
      collectedNodes.combine(traverse(n, depth + 1, maxDepth));
    });
  }

  // go up
  return collectedNodes.combine(traverse(node.inEdge, depth, maxDepth));
}

module.exports = {
  QueryResult,
  traverse
};
