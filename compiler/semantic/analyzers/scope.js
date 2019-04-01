const {
  ClassNotFoundError,
  FunctionNotFoundError,
  UndeclaredVariableError
} = require('../errors');

class ScopeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.name === 'main_module');

    this.analyzeReferences(codeModule);
    this.analyzeDeclarations(codeModule);
    this.analyzeInstanceReferences(codeModule);
    this.analyzeInstantiations(codeModule);
    this.analyzeInvocations(codeModule);
    this.analyzeFunctions(codeModule);
  }

  analyzeReferences (node) {
    const iterator = this.sourceGraph.traverse();
    iterator.iterate(node, (n) => {
      if (n.attributes.type === 'variable_reference') {
        this.checkReference(n);
      }
    });
  }

  analyzeDeclarations (node) {
    const iterator = this.sourceGraph.traverse();
    iterator.iterate(node, (n) => {
      if (n.attributes.type === 'immutable_declaration' || n.attributes.type === 'mutable_declaration') {
        this.checkDeclaration(n);
      }
    });
  }

  analyzeInstantiations (node) {
    const iterator = this.sourceGraph.traverse();
    iterator.iterate(node, (n) => {
      if (n.attributes.type === 'instantiation') {
        this.checkInstantiation(n);
      }
    });
  }

  analyzeInstanceReferences (node) {
    const iterator = this.sourceGraph.traverse();
    iterator.iterate(node, (n) => {
      if (n.attributes.type === 'instance_reference') {
        this.checkInstanceReference(n);
      }
    });
  }

  analyzeInvocations (node) {
    const iterator = this.sourceGraph.traverse();
    iterator.iterate(node, (n) => {
      if (n.attributes.type === 'invocation') {
        this.checkInvocation(n);
      }
    });
  }

  analyzeFunctions (node) {
    const iterator = this.sourceGraph.traverse();
    iterator.iterate(node, (n) => {
      if (n.attributes.type === 'function' || n.attributes.type === 'method') {
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

  checkInstantiation (node) {
    const scopeNodes = this.buildSymbolTable(node);

    const declClass = scopeNodes.find((n) => {
      return n.attributes.type === 'class_definition' &&
        n.attributes.identifier === node.attributes.class;
    });

    if (!declClass) {
      throw new ClassNotFoundError(`Cannot instantiate unknown class \`${node.attributes.class}\``);
    }

    this.sourceGraph.addEdge(node, declClass, 'binding');
    this.sourceGraph.addEdge(declClass, node, 'reference');
  }

  checkInvocation (node) {
    // try find the closest declaration that matches
    const scopeNodes = this.buildSymbolTable(node);
    const declNode = scopeNodes.find((n) => {
      return n.attributes.name === node.attributes.name ||
        n.attributes.identifier === node.attributes.name;
    });

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

  checkInstanceReference (node) {
    // try find the closest declaration that matches
    const pathExprNode = this.sourceGraph.relationFromNode(node, 'key_expression')[0];
    const scopeNodes = this.buildSymbolTable(node);
    const declNode = scopeNodes.find((n) => n.attributes.identifier === pathExprNode.attributes.identifier);

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

      if (this.scopable(node)) {
        scopeNodes.push(node);
      }

      const parent = this.sourceGraph.incoming(node);
      if (parent[0]) {
        this.directScope(parent[0]).forEach((n) => {
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
      node.attributes.type === 'import_declaration' ||
      node.attributes.type === 'class_definition' ||
      node.attributes.type === 'function';
  }

  directScope (node) {
    // handle the top level module as a special case
    // so we can make sure import declarations are included in the scope
    if (node.attributes.type === 'module') {
      const scope = this.sourceGraph.outgoing(node);
      // include the imports
      const imports = this.sourceGraph.search('import_statement');
      imports.forEach((i) => {
        scope.push(this.sourceGraph.relationFromNode(i, 'import')[0]);
      });

      return scope;
    } else {
      return this.sourceGraph.outgoing(node);
    }
  }
}

module.exports = ScopeAnalyzer;
