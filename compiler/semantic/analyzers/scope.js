const {
  // ClassNotFoundError,
  FunctionNotFoundError,
  NoMatchingModuleExport,
  UndeclaredModuleError,
  UndeclaredVariableError
} = require('../errors');

class SymbolTable {
  constructor () {
    this.symbols = [];
  }

  addSymbol (node) {
    this.symbols.push(node);
  }

  hasSymbol (node) {
    return this.symbols.find((s) =>
      s.attributes.identifier === node.attributes.identifier
    ) !== undefined;
  }

  hasFunctionSymbol (funcNode) {
    return this.symbols
      .filter((s) => s.type !== 'function')
      .find((s) => s.attributes.identifier === funcNode.attributes.identifier) !== undefined;
  }

  hasExportSymbol (funcNode) {
    return this.symbols
      .filter((s) => s.type !== 'function')
      .find((s) => s.attributes.name === funcNode.attributes.identifier) !== undefined;
  }

  hasImportSymbol (refNode) {
    return this.symbols
      .filter((s) => s.type !== 'import_declaration')
      .find((s) => s.attributes.identifier === refNode.attributes.name) !== undefined;
  }

  matchingSymbol (node) {
    return this.symbols.find((s) =>
      s.attributes.identifier === node.attributes.identifier ||
      s.attributes.identifier === node.attributes.name
    );
  }
}

class ScopeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
    this.symbolStack = [];
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.name === 'main_module');

    // add this modules top-level expressions to the base symbol SymbolTable
    this.buildModuleScope(codeModule);

    // begin the recursive traverse from each top level expr
    const exprs = this.sourceGraph.outgoing(codeModule);
    exprs.forEach((n) => {
      this.analyzeNode(n);
    });
  }

  buildModuleScope (node) {
    const symbolTable = new SymbolTable();
    const exprs = this.sourceGraph.outgoing(node);

    exprs.forEach((node) => {
      if (this.isDirectScope(node)) {
        symbolTable.addSymbol(node);
      } else if (this.isImportScope(node)) {
        const imports = this.sourceGraph.relationFromNode(node, 'import');
        imports.forEach((i) => {
          if (this.isDirectScope(i)) {
            symbolTable.addSymbol(i);
          }
        });
      } else if (this.isExportScope(node)) {
        const exports = this.sourceGraph.outgoing(node);
        exports.forEach((i) => {
          // for now we only allow functions to be exported
          // will need to support classes too
          if (i.attributes.type === 'function') {
            symbolTable.addSymbol(i);
          }
        });
      }
    });

    this.symbolStack.unshift(symbolTable);
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'import_statement':
        return this.analyzeImport(node);
      case 'immutable_declaration':
      case 'mutable_declaration':
        return this.analyzeDeclaration(node);
      case 'function':
        return this.analyzeFunction(node);
      case 'return_statement':
        return this.analyzeReturn(node);
      case 'assignment':
      case 'bin_op':
        return this.analyzeBinOP(node);
      case 'variable_reference':
        return this.analyzeReference(node);
      case 'invocation':
        return this.analyzeInvocation(node);
      default:
        // console.log('Unknow scope expression', node);
    }
  }

  analyzeDeclaration (node) {
    const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];
    if (expr) {
      const binding = this.analyzeNode(expr);
      this.createBinding(expr, binding);
    }
  }

  analyzeImport (node) {
    const modules = this.sourceGraph.search('module');
    const sourceModule = modules.find((m) => m.attributes.name === node.attributes.name);

    if (!sourceModule) {
      throw new UndeclaredModuleError(`Imported module \`${node.attributes.name}\` not found`);
    }

    this.buildModuleScope(sourceModule);

    // now check imports against exports
    const imports = this.sourceGraph.relationFromNode(node, 'import');
    imports.forEach((i) => {
      const sym = this.symbolStack.find((t) => {
        return t.hasExportSymbol(i);
      });

      if (!sym) {
        throw new NoMatchingModuleExport(`Import \`${i.attributes.identifier}\` was not found in module \`${sourceModule.attributes.name}\``);
      }

      const exportSymbol = sym.matchingSymbol(i);
      this.createBinding(i, exportSymbol);
    });

    this.symbolStack.shift(); // pop off this scope of the imported module as we leave
  }

  analyzeFunction (node) {
    // functions build a new scope
    const symbols = new SymbolTable();
    const syms = this.sourceGraph.outgoing(node);
    syms.forEach((node) => {
      if (this.scopable(node)) {
        symbols.addSymbol(node);
      }
    });

    this.symbolStack.unshift(symbols);

    const exprs = this.sourceGraph.relationFromNode(node, 'body');
    exprs.forEach((expr) => {
      this.analyzeNode(expr);
    });

    this.symbolStack.shift(); // pop off this scope of this function as we leave
  }

  analyzeReturn (node) {
    const expr = this.sourceGraph.relationFromNode(node, 'expression')[0];
    const binding = this.analyzeNode(expr);

    if (binding) {
      this.createBinding(expr, binding);
    }
  }

  analyzeBinOP (node) {
    const leftExpr = this.sourceGraph.relationFromNode(node, 'left')[0];
    const rightExpr = this.sourceGraph.relationFromNode(node, 'right')[0];

    const leftBinding = this.analyzeNode(leftExpr);
    this.createBinding(leftExpr, leftBinding);

    const rightBinding = this.analyzeNode(rightExpr);
    this.createBinding(rightExpr, rightBinding);
  }

  analyzeInvocation (node) {
    // check symbol table for the reference
    const sym = this.symbolStack.find((t) => {
      return t.hasFunctionSymbol(node) || t.hasImportSymbol(node);
    });

    if (sym) {
      const binding = sym.matchingSymbol(node);
      this.createBinding(node, binding);
      return binding;
    }

    throw new FunctionNotFoundError(`Use of undeclared function \`${node.attributes.name}\``);
  }

  analyzeReference (node) {
    // check symbol table for the reference
    const sym = this.symbolStack.find((t) => {
      return t.hasSymbol(node);
    });

    if (sym) {
      return sym.matchingSymbol(node);
    }

    throw new UndeclaredVariableError(`Use of undeclared variable \`${node.attributes.identifier}\``);
  }

  createBinding (refNode, boundNode) {
    if (refNode && boundNode) {
      this.sourceGraph.addEdge(refNode, boundNode, 'binding');
      this.sourceGraph.addEdge(boundNode, refNode, 'reference');
    }
  }

  isDirectScope (node) {
    return node.attributes.type === 'immutable_declaration' ||
      node.attributes.type === 'function_argument' ||
      node.attributes.type === 'mutable_declaration' ||
      node.attributes.type === 'method' ||
      node.attributes.type === 'function' ||
      node.attributes.type === 'import_declaration';
  }

  isImportScope (node) {
    return node.attributes.type === 'import_statement';
  }

  isExportScope (node) {
    return node.attributes.type === 'export_statement';
  }

  scopable (node) {
    return node.attributes.type === 'immutable_declaration' ||
      node.attributes.type === 'function_argument' ||
      node.attributes.type === 'mutable_declaration' ||
      node.attributes.type === 'immutable_declaration' ||
      node.attributes.type === 'import_declaration' ||
      node.attributes.type === 'class_definition' ||
      node.attributes.type === 'method' ||
      node.attributes.type === 'function';
  }
}

module.exports = ScopeAnalyzer;
