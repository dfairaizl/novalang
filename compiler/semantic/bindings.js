const {
  FunctionNotFoundError,
  ImportNotFoundError,
  UndeclaredModuleError,
  UndeclaredVariableError
} = require('./errors');

class BindingAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
  }

  analyze () {
    const sourceQuery = this.sourceGraph.query();
    const sources = sourceQuery
      .match({ type: 'module', identifier: 'main_module' })
      .execute();

    if (sources.nodes()[0]) {
      this.codeModule = sources.nodes()[0];
      this.bindSources(this.codeModule);
    }
  }

  bindSources (sourceNode) {
    const sourceQuery = this.sourceGraph.query();
    const sources = sourceQuery
      .begin(sourceNode)
      .outgoing()
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    sources.nodes().forEach((source) => {
      const binding = this.checkBinding(source);
      if (binding) {
        return binding;
      }

      switch (source.attributes.type) {
        case 'assignment':
        case 'bin_op':
        case 'conditional_branch':
        case 'do_while_loop':
        case 'else_expression':
        case 'export_statement':
        case 'function':
        case 'if_conditional':
        case 'immutable_declaration':
        case 'mutable_declaration':
        case 'return_statement':
        case 'while_loop':
          return this.bindSources(source);
      }

      this.analyzeNode(source);
    });
  }

  analyzeNode (sourceNode) {
    switch (sourceNode.attributes.type) {
      case 'invocation':
        // first find the function call to the function, then bind any arguments
        this.bindInvocation(sourceNode);
        this.bindSources(sourceNode);
        break;
      case 'variable_reference':
        this.bindReference(sourceNode);
        break;
      case 'import_statement':
        this.bindImport(sourceNode);
        break;
    }
  }

  bindFunction (functionNode) {
    const sourceQuery = this.sourceGraph.query();

    const sources = sourceQuery
      .begin(functionNode)
      .outgoing()
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    sources.nodes().forEach((source) => {
      this.analyzeNode(source);
    });
  }

  bindImport (importNode) {
    const sourceQuery = this.sourceGraph.query();

    const sources = sourceQuery
      .match({ type: 'module', identifier: importNode.attributes.identifier })
      .execute();

    const modules = sources.nodes();

    if (modules[0]) {
      const sourceModule = modules[0];

      // extract exports from module
      const sourceQuery = this.sourceGraph.query();
      const sources = sourceQuery
        .begin(sourceModule)
        .outgoing()
        .any({ maxDepth: 1 })
        .match({ type: 'export_statement' })
        .outgoing()
        .any({ maxDepth: 1 })
        .matchAll()
        .execute();

      const moduleExports = [];
      sources.paths().forEach((path) => {
        const exported = path[path.length - 1];

        if (this.isExport(exported)) {
          moduleExports.push(exported);
        }
      });

      // now go get the import declarations
      const importQuery = this.sourceGraph.query();
      importQuery
        .begin(importNode)
        .outgoing()
        .any({ maxDepth: 1 })
        .match({ type: 'import_declaration' })
        .execute();

      importQuery.nodes().forEach((node) => {
        const bindingExport = moduleExports.find((e) => e.attributes.identifier === node.attributes.identifier);
        if (bindingExport) {
          this.sourceGraph.addEdge(node, bindingExport, 'binding');
          return;
        }

        throw new ImportNotFoundError(`Import \`${node.attributes.identifier}\` not found in source module \`${importNode.attributes.identifier}\``);
      });

      return;
    }

    throw new UndeclaredModuleError(`Cannot import from undeclared module \`${importNode.attributes.identifier}\``);
  }

  checkBinding (node) {
    // check if this node has an already computed type
    const typeQuery = this.sourceGraph.query();
    typeQuery.begin(node)
      .outgoing('binding')
      .any({ maxDepth: 1 })
      .matchAll()
      .execute();

    if (typeQuery.nodes().length === 1) {
      return typeQuery.nodes()[0];
    }

    return null;
  }

  bindInvocation (invocationNode) {
    const q1 = this.sourceGraph.query();
    const q2 = this.sourceGraph.query();

    const imports = q1.begin(this.codeModule)
      .outgoing()
      .any()
      .match({ type: 'import_declaration' })
      .execute()
      .nodes();

    const functions = q2.begin(this.codeModule)
      .outgoing()
      .any()
      .match({ type: 'function' })
      .execute()
      .nodes();

    const ident = invocationNode.attributes.identifier;

    const matchingFunc = functions.find((i) => i.attributes.identifier === ident);
    const matchingImport = imports.find((i) => i.attributes.identifier === ident);

    // lexical scope, prioritize local functions over imports

    if (matchingFunc) {
      this.sourceGraph.addEdge(invocationNode, matchingFunc, 'binding');
      return;
    }

    if (matchingImport) {
      this.sourceGraph.addEdge(invocationNode, matchingImport, 'binding');
      return;
    }

    throw new FunctionNotFoundError(`Cannot invoke undefined function \`${ident}\``);
  }

  bindReference (referenceNode) {
    const query = this.sourceGraph.query();
    query.begin(this.codeModule)
      .outgoing()
      .any()
      .match(referenceNode.attributes)
      .execute();

    const codePaths = query.paths();

    // giving the path from the module to this node, build up a scope
    if (codePaths.length > 0) {
      const scope = [];

      codePaths.forEach((path) => {
        path.forEach((node) => {
          const query = this.sourceGraph.query();
          query.begin(node)
            .outgoing()
            .any({ maxDepth: 1 })
            .matchAll()
            .execute();

          const lexicalNodes = query.nodes().filter((n) => this.isReferenceDeclaration(n));
          if (lexicalNodes.length > 0) {
            scope.push(lexicalNodes);
          }
        });
      });

      // find the last instance of a matching node
      const scoped = scope.reverse().find((s) => {
        const n = s.find((n) => this.isReferenceDeclaration(n) && n.attributes.identifier === referenceNode.attributes.identifier);

        if (n) {
          this.sourceGraph.addEdge(referenceNode, n, 'binding');
          return true;
        }

        return false;
      });

      if (scoped) {
        return;
      }
    }

    // no matching delcaration found!
    throw new UndeclaredVariableError(`Unknown variable \`${referenceNode.attributes.identifier}\``);
  }

  // helpers

  isReferenceDeclaration (n) {
    return n.attributes.type === 'immutable_declaration' ||
      n.attributes.type === 'mutable_declaration' ||
      n.attributes.type === 'function_argument';
  }

  isExport (n) {
    return n.attributes.type === 'external_function' ||
      n.attributes.type === 'function';
  }
}

module.exports = BindingAnalyzer;
