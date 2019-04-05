const {
  ClassNotFoundError,
  FunctionNotFoundError,
  NoMatchingModuleExport,
  UndeclaredModuleError,
  UndeclaredVariableError
} = require('../errors');

class SymbolFrame {
  constructor () {
    this.symbols = [];
  }

  addSymbol (node) {
    this.symbols.push(node);
  }
}

class SymbolTable {
  constructor () {
    this.frames = [];
  }

  pushFrame (frame) {
    this.frames.unshift(frame);
  }

  popFrame () {
    this.frames.shift();
  }

  findVariableSymbol (varNode) {
    const frame = this.frames.find((frame) => {
      return frame.symbols.find((s) => {
        return this.isVariable(s) && s.attributes.identifier === varNode.attributes.identifier;
      });
    });

    if (!frame) {
      return null;
    }

    return frame.symbols.find((f) => this.isVariable(f) && f.attributes.identifier === varNode.attributes.identifier);
  }

  findInvocationSymbol (invokeNode) {
    const frame = this.frames.find((frame) => {
      return frame.symbols.find((s) => {
        return (this.isImport(s) || this.isFunction(s)) && s.attributes.identifier === invokeNode.attributes.identifier;
      });
    });

    if (!frame) {
      return null;
    }

    return frame.symbols.find((f) => (this.isImport(f) || this.isFunction(f)) && f.attributes.identifier === invokeNode.attributes.identifier);
  }

  findClassSymbol (classNode) {
    const frame = this.frames.find((frame) => {
      return frame.symbols.find((s) => {
        return this.isClass(s) && s.attributes.identifier === classNode.attributes.identifier;
      });
    });

    if (!frame) {
      return null;
    }

    return frame.symbols.find((f) => this.isClass(f) && f.attributes.identifier === classNode.attributes.identifier);
  }

  findExportSymbol (exportNode) {
    let symbol = null;

    this.frames.forEach((frame) => {
      const sym = frame.symbols.find((s) => {
        return this.isFunction(s) && s.attributes.identifier === exportNode.attributes.identifier;
      });

      if (sym) {
        symbol = sym;
      }
    });

    return symbol;
  }

  // helpers

  isFunction (node) {
    return node.attributes.type === 'function' || node.attributes.type === 'external_function';
  }

  isImport (node) {
    return node.attributes.type === 'import_declaration';
  }

  isClass (node) {
    return node.attributes.type === 'class_definition';
  }

  isVariable (node) {
    return node.attributes.type === 'immutable_declaration' ||
      node.attributes.type === 'mutable_declaration' ||
      node.attributes.type === 'function_argument';
  }
}

class ScopeAnalyzer {
  constructor (sourceGraph) {
    this.sourceGraph = sourceGraph;
    this.symbolTable = new SymbolTable();
  }

  analyze () {
    const codeModule = this.sourceGraph.nodes.find((n) => n.attributes.identifier === 'main_module');

    // add this modules top-level expressions to the base symbol SymbolTable
    this.buildModuleScope(codeModule);

    // begin the recursive traverse from each top level expr
    const exprs = this.sourceGraph.outgoing(codeModule);
    exprs.forEach((n) => {
      this.analyzeNode(n);
    });

    // TODO: create a pass after scoping to check for unreferenced things
  }

  buildModuleScope (node) {
    const frame = new SymbolFrame();
    const exprs = this.sourceGraph.outgoing(node);

    exprs.forEach((node) => {
      if (this.isDirectScope(node)) {
        frame.addSymbol(node);
      } else if (this.isImportScope(node)) {
        const imports = this.sourceGraph.relationFromNode(node, 'import');
        imports.forEach((i) => {
          if (this.isDirectScope(i)) {
            frame.addSymbol(i);
          }
        });
      } else if (this.isExportScope(node)) {
        const exports = this.sourceGraph.outgoing(node);
        exports.forEach((i) => {
          // for now we only allow functions to be exported
          // will need to support classes too
          if (i.attributes.type === 'function' || i.attributes.type === 'external_function') {
            frame.addSymbol(i);
          }
        });
      } else if (this.isClassScope(node)) {
        const classExprs = this.sourceGraph.outgoing(node);
        frame.addSymbol(node);

        classExprs.forEach((i) => {
          if (i.attributes.type === 'method') {
            frame.addSymbol(i);
          }
        });
      }
    });

    // this.symbolStack.unshift(symbolTable);
    this.symbolTable.pushFrame(frame);
  }

  analyzeNode (node) {
    switch (node.attributes.type) {
      case 'import_statement':
        return this.analyzeImport(node);
      case 'immutable_declaration':
      case 'mutable_declaration':
        return this.analyzeDeclaration(node);
      case 'class_definition':
        return this.analyzeClass(node);
      case 'function':
      case 'method':
      case 'constructor':
        return this.analyzeFunction(node);
      case 'return_statement':
        return this.analyzeReturn(node);
      case 'assignment':
      case 'bin_op':
        return this.analyzeBinOP(node);
      case 'variable_reference':
      case 'key_reference':
        return this.analyzeReference(node);
      case 'instance_reference':
        return this.analyzeInstanceReference(node);
      case 'invocation':
        return this.analyzeInvocation(node);
      case 'instantiation':
        return this.analyzeInstantiation(node);
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

  analyzeClass (node) {
    const classBody = this.sourceGraph.relationFromNode(node, 'body');

    this.buildModuleScope(node);

    classBody.forEach((bodyNode) => {
      this.analyzeNode(bodyNode);
    });

    this.symbolTable.popFrame();
  }

  analyzeImport (node) {
    const modules = this.sourceGraph.search('module');
    const sourceModule = modules.find((m) => m.attributes.identifier === node.attributes.identifier);
    if (!sourceModule) {
      throw new UndeclaredModuleError(`Imported module \`${node.attributes.identifier}\` not found`);
    }

    this.buildModuleScope(sourceModule);

    // now check imports against exports
    const imports = this.sourceGraph.relationFromNode(node, 'import');
    imports.forEach((i) => {
      const sym = this.symbolTable.findExportSymbol(i);

      if (sym) {
        this.createBinding(i, sym);
      } else {
        throw new NoMatchingModuleExport(`Import \`${i.attributes.identifier}\` was not found in module \`${sourceModule.attributes.identifier}\``);
      }
    });

    this.symbolTable.popFrame(); // pop off this scope of the imported module as we leave
  }

  analyzeFunction (node) {
    // functions build a new scope
    const frame = new SymbolFrame();
    const syms = this.sourceGraph.outgoing(node);
    syms.forEach((node) => {
      if (this.scopable(node)) {
        frame.addSymbol(node);
      }
    });

    // this.symbolStack.unshift(frame);
    this.symbolTable.pushFrame(frame);

    const exprs = this.sourceGraph.relationFromNode(node, 'body');
    exprs.forEach((expr) => {
      this.analyzeNode(expr);
    });

    this.symbolTable.popFrame();
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
    const sym = this.symbolTable.findInvocationSymbol(node);

    if (sym) {
      this.createBinding(node, sym);

      // analyze invocation arguments
      const args = this.sourceGraph.relationFromNode(node, 'arguments');
      args.forEach((arg) => {
        const argBinding = this.analyzeNode(arg);
        this.createBinding(arg, argBinding);
      });

      return sym;
    }

    throw new FunctionNotFoundError(`Use of undeclared function \`${node.attributes.identifier}\``);
  }

  analyzeInstantiation (node) {
    // check symbol table for the reference
    const sym = this.symbolTable.findClassSymbol(node);

    if (sym) {
      this.createBinding(node, sym);
      return sym;
    }

    throw new ClassNotFoundError(`Cannot instantiate undefined class \`${node.attributes.class}\``);
  }

  analyzeReference (node) {
    // check symbol table for the reference
    const sym = this.symbolTable.findVariableSymbol(node);

    if (sym) {
      return sym;
    }

    throw new UndeclaredVariableError(`Use of undeclared variable \`${node.attributes.identifier}\``);
  }

  analyzeInstanceReference (node) {
    const keyPath = this.sourceGraph.relationFromNode(node, 'key_expression')[0];
    const ref = this.analyzeNode(keyPath);

    if (ref) {
      this.createBinding(keyPath, ref);
      return ref;
    }

    throw new ClassNotFoundError(`Cannot instantiate undefined class \`${node.attributes.class}\``);
  }

  createBinding (refNode, boundNode) {
    // check if the binding was already created
    if (this.sourceGraph.relationFromNode(refNode, 'binding')[0]) {
      return;
    }

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

  isClassScope (node) {
    return node.attributes.type === 'class_definition';
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
