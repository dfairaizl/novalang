const {
  FunctionNotFoundError,
  UndeclaredVariableError
} = require('../errors');

class ScopeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.type === 'module');

    this.analyzeReferences(codeModule);
    this.analyzeDeclarations(codeModule);
    this.analyzeInvocations(codeModule);
    this.analyzeFunctions(codeModule);
  }

  analyzeReferences (node) {
    const iterator = this.sourceGraph.traverse(node);
    iterator.iterate((n) => {
      if (n.attributes.type === 'variable_reference') {
        this.checkReference(n);
      }
    });
  }

  analyzeDeclarations (node) {
    const iterator = this.sourceGraph.traverse(node);
    iterator.iterate((n) => {
      if (n.attributes.type === 'immutable_declaration' || n.attributes.type === 'mutable_declaration') {
        this.checkDeclaration(n);
      }
    });
  }

  analyzeInvocations (node) {
    const iterator = this.sourceGraph.traverse(node);
    iterator.iterate((n) => {
      if (n.attributes.type === 'invocation') {
        this.checkInvocation(n);
      }
    });
  }

  analyzeFunctions (node) {
    const iterator = this.sourceGraph.traverse(node);
    iterator.iterate((n) => {
      if (n.attributes.type === 'function') {
        this.checkFunction(n);
      }
    });
  }

  checkDeclaration (node) {
    const refs = this.sourceGraph.relationFromNode(node, 'reference');
    if (refs.length === 0) {
      console.info(`WARNING: Variable declaration \`${node.attributes.identifier}\` has not been used`);
    }
  }

  checkInvocation (node) {
    // try find the closest declaration that matches
    const scopeNodes = this.buildSymbolTable(node);
    const declNode = scopeNodes.find((n) => n.attributes.name === node.attributes.name);

    if (!declNode) {
      throw new FunctionNotFoundError(`Use of undeclared function \`${node.attributes.name}\``);
    }

    this.sourceGraph.addEdge(node, declNode, 'binding');
    this.sourceGraph.addEdge(declNode, node, 'reference');
  }

  checkReference (node) {
    // try find the closest declaration that matches
    const scopeNodes = this.buildSymbolTable(node);

    const declNode = scopeNodes.find((n) => n.attributes.identifier === node.attributes.identifier);

    if (!declNode) {
      throw new UndeclaredVariableError(`Use of undeclared variable \`${node.attributes.identifier}\``);
    }

    this.sourceGraph.addEdge(node, declNode, 'binding');
    this.sourceGraph.addEdge(declNode, node, 'reference');
  }

  checkFunction (node) {
    const refs = this.sourceGraph.relationFromNode(node, 'reference');
    if (refs.length === 0) {
      console.info(`WARNING: Function \`${node.attributes.name}\` has not been used`);
    }
  }

  buildSymbolTable (node) {
    // basic algorithm
    // 1. given node, collect all child nodes
    // 2. find node's parent
    // 3. repeat until there is no parent to a node

    const scopeNodes = [];
    const visited = {};

    const walk = (node) => {
      visited[node.id] = true;

      const parent = this.sourceGraph.incoming(node);
      if (parent[0]) {
        this.sourceGraph.outgoing(parent[0]).forEach((n) => {
          if (!visited[n.id]) {
            if (this.scopable(n)) {
              scopeNodes.push(n);
            }
          }
        });

        return walk(parent[0], scopeNodes);
      }

      return scopeNodes;
    };

    return walk(node);
  }

  scopable (node) {
    return node.attributes.type === 'immutable_declaration' ||
      node.attributes.type === 'function_argument' ||
      node.attributes.type === 'mutable_declaration' ||
      node.attributes.type === 'immutable_declaration' ||
      node.attributes.type === 'function';
  }
}

module.exports = ScopeAnalyzer;
