const { Query } = require('@novalang/graph');
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
    const sourceQuery = new Query(this.sourceGraph);
    const result = sourceQuery
      .match({ type: 'module', identifier: 'main_module' }, { name: 'sources' })
      .returns('sources');

    this.codeModule = result.sources[0];
    this.bindSources(this.codeModule);
  }

  bindSources (sourceNode) {
    const sourceQuery = new Query(this.sourceGraph);
    const result = sourceQuery
      .find(sourceNode)
      .out(null, { name: 'sources' })
      .returns('sources');

    result.sources.forEach((source) => {
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
        case 'class_definition':
        case 'function':
        case 'method':
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
      case 'instantiation':
        this.bindIinstantiation(sourceNode);
        break;
    }
  }

  bindImport (importNode) {
    const sourceQuery = new Query(this.sourceGraph);

    const sources = sourceQuery
      .match({ type: 'module', identifier: importNode.attributes.identifier }, { name: 'mod' })
      .returns('mod');

    const modules = sources.mod;

    if (modules[0]) {
      const sourceModule = modules[0];

      // extract exports from module
      const sourceQuery = new Query(this.sourceGraph);

      const result = sourceQuery
        .find(sourceModule)
        .out()
        .where({ type: 'export_statement' })
        .out(null, { name: 'deps'})
        .returns('deps');

      const moduleExports = [];

      result.deps.forEach((exported) => {
        moduleExports.push(exported);
      });

      // now go get the import declarations
      const importQuery = new Query(this.sourceGraph);

      const iresult = importQuery
        .find(importNode)
        .out()
        .where({ type: 'import_declaration' }, { name: 'imports'})
        .returns('imports');

      iresult.imports.forEach((node) => {
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
    const typeQuery = new Query(this.sourceGraph);
    const result = typeQuery.find(node)
      .out('binding', { name: 'binding' })
      .returns('binding');

    if (result.binding.length === 1) {
      return result.binding[0];
    }

    return null;
  }

  bindInvocation (invocationNode) {
    const q1 = new Query(this.sourceGraph);
    const q2 = new Query(this.sourceGraph);

    const importResults = q1
      .find(this.codeModule)
      .out()
      .where({ type: 'import_statement' })
      .out('import', { name: 'imports'} )
      .returns('imports');

    // NOTE: - BUG - THIS DOES NOT ACCOUNT FOR NESTED SCOPES OF FUNCTIONS
    const functionResults = q2
      .find(this.codeModule)
      .out()
      .where({ type: 'function' }, { name: 'functions' })
      .returns('functions');

    const ident = invocationNode.attributes.identifier;

    const matchingFunc = functionResults.functions.find((i) => i.attributes.identifier === ident);
    const matchingImport = importResults.imports.find((i) => i.attributes.identifier === ident);

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
    const query = new Query(this.sourceGraph);
    const result = query.find(this.codeModule)
      .out()
      .until(referenceNode.attributes, { name: 'scope' })
      .returns('scope');

    const scopeNode = result.scope.reverse().find((n) => {
      return this.isReferenceDeclaration(n) && n.attributes.identifier === referenceNode.attributes.identifier
    });

    if (scopeNode) {
      this.sourceGraph.addEdge(referenceNode, scopeNode, 'binding');

      return true;
    }

    // no matching delcaration found!
    throw new UndeclaredVariableError(`Unknown variable \`${referenceNode.attributes.identifier}\``);
  }

  bindIinstantiation(instNode) {
    const query = new Query(this.sourceGraph);

    const results = query
      .find(this.codeModule)
      .out()
      .where({ type: 'class_definition', name: instNode.identifier }, { name: 'classDef'})
      .returns('classDef');

    const classDefinition = results.classDef[0];

    if (classDefinition) {
      this.sourceGraph.addEdge(instNode, classDefinition, 'binding');
      return;
    }

    // no matching class definition found!
    throw new UndeclaredVariableError(`Unknown class \`${referenceNode.attributes.identifier}\``);
  }

  // helpers

  isReferenceDeclaration (n) {
    return n.attributes.type === 'immutable_declaration' ||
      n.attributes.type === 'mutable_declaration' ||
      n.attributes.type === 'function_argument';
  }
}

module.exports = BindingAnalyzer;
