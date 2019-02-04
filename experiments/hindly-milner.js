// a typescript implement of hindley-milner type inference
// reference http://smallshire.org.uk/sufficientlysmall/2010/04/11/a-hindley-milner-type-inference-implementation-in-python/
class Id {
  constructor (name) {
    this.name = name;
  }

  toString () { return this.name; }
}

class Lambda {
  constructor (arg, body) {
    this.arg = arg;
    this.body = body;
  }

  toString () { return `(fn ${this.arg} => ${this.body})`; }
}

class Apply {
  constructor (func, arg) {
    this.func = func;
    this.arg = arg;
  }

  toString () { return `(${this.func} ${this.arg})`; }
}

class Let {
  constructor (variable, value, body) {
    this.variable = variable;
    this.value = value;
    this.body = body;
  }

  toString () { return `(let ${this.variable} = ${this.value} in ${this.body})`; }
}

class Letrec {
  constructor (variable, value, body) {
    this.variable = variable;
    this.value = value;
    this.body = body;
  }

  toString () { return `(letrec ${this.variable} = ${this.value} in ${this.body})`; }
}

class TypeVariable {
  toString () {
    return this.instance ? this.instance.toString() : this.name;
  }

  get name () {
    return this._name || (this._name = 't' + (TypeVariable.lastNameIndex++));
  }
}

TypeVariable.lastNameIndex = 0;

class TypeOperator {
  constructor (name, types) {
    this.name = name;
    this.types = types;
  }

  toString () {
    if (this.types.length === 0) { return this.name; } else if (this.types.length === 2) { return `(${this.types[0]} ${this.name} ${this.types[1]})`; } else { return `${this.name} ${this.types.join(' ')}`; }
  }
}

const IntegerType = new TypeOperator('int', []);
const BoolType = new TypeOperator('bool', []);
const FunctionType = (from, to) => new TypeOperator('->', [from, to]);

class TypeEnv {
  constructor (map = {}) {
    this.map = map;
  }

  get (name, nonGenerics) {
    if (name in this.map) { return fresh(this.map[name], nonGenerics); }
    throw new Error('undefined symbol: ' + name);
  }

  extend (name, val) {
    return new TypeEnv(Object.assign({}, this.map, { [name]: val }));
  }
}

function analyse (node, env, nonGeneric) {
  if (node instanceof Id) {
    return env.get(node.name, nonGeneric);
  } else if (node instanceof Apply) {
    let funcType = analyse(node.func, env, nonGeneric);
    let argType = analyse(node.arg, env, nonGeneric);
    let retType = new TypeVariable();

    unify(FunctionType(argType, retType), funcType);

    return retType;
  } else if (node instanceof Lambda) {
    let argType = new TypeVariable();
    let newEnv = env.extend(node.arg, argType);
    let newGeneric = new Set(Array.from(nonGeneric).concat(argType));
    let retType = analyse(node.body, newEnv, newGeneric);

    return FunctionType(argType, retType);
  } else if (node instanceof Let) {
    let valType = analyse(node.value, env, nonGeneric);
    let newEnv = env.extend(node.variable, valType);

    return analyse(node.body, newEnv, nonGeneric);
  } else if (node instanceof Letrec) {
    let newType = new TypeVariable();
    let newEnv = env.extend(node.variable, newType);
    let newGeneric = new Set(Array.from(nonGeneric).concat(newType));
    let valType = analyse(node.value, newEnv, newGeneric);

    unify(newType, valType);

    return analyse(node.body, newEnv, nonGeneric);
  } else {
    throw new Error('unhandled syntax node ' + node);
  }
}

function fresh (type, nonGeneric) {
  const mappings = new WeakMap();

  function freshrec (type) {
    type = prune(type);
    if (type instanceof TypeVariable) {
      if (isGeneric(type, nonGeneric)) {
        if (!mappings.has(type)) { mappings.set(type, new TypeVariable()); }
        return mappings.get(type);
      } else {
        return type;
      }
    } else if (type instanceof TypeOperator) {
      return new TypeOperator(type.name, type.types.map(freshrec));
    } else {
      throw new Error('unexpected type to fresh');
    }
  }

  return freshrec(type);
}

function unify (type1, type2) {
  let t1 = prune(type1);
  let t2 = prune(type2);

  if (t1 instanceof TypeVariable) {
    if (t1 !== t2) {
      if (occursInType(t1, t2)) { throw new Error('recurive unification'); }
      t1.instance = t2;
    }
  } else if (t1 instanceof TypeOperator && t2 instanceof TypeVariable) {
    return unify(t2, t1);
  } else if (t1 instanceof TypeOperator && t2 instanceof TypeOperator) {
    if (t1.name !== t2.name || t1.types.length !== t2.types.length) {
      throw new Error('type mismatch: ' + t1 + ' != ' + t2);
    }

    t1.types.forEach((t, i) => unify(t1.types[i], t2.types[i]));
  } else {
    throw new Error('unexpected types to unify');
  }
}

function prune (type) {
  if (type instanceof TypeVariable && type.instance) { return (type.instance = prune(type.instance)); }
  return type;
}

function isGeneric (type, nonGenerics) {
  return !occursInTypes(type, Array.from(nonGenerics));
}

function occursInType (type, typeIn) {
  typeIn = prune(typeIn);
  if (typeIn === type) {
    return true;
  } else if (typeIn instanceof TypeOperator) {
    return occursInTypes(type, typeIn.types);
  }

  return false;
}

function occursInTypes (type, types) {
  return types.some(t => occursInType(type, t));
}

// ...
const type1 = new TypeVariable();
const type2 = new TypeVariable();
const type3 = new TypeVariable();

const env = new TypeEnv({
  pair: FunctionType(type1, FunctionType(type2, new TypeOperator('*', [type1, type2]))),
  cond: FunctionType(BoolType, FunctionType(type3, FunctionType(type3, type3))),
  zero: FunctionType(IntegerType, BoolType),
  pred: FunctionType(IntegerType, IntegerType),
  times: FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
  0: IntegerType,
  true: BoolType
});

function parse (node) {
  if (Array.isArray(node)) {
    var head = node[0];
    if (head === 'lambda' && node.length > 3) {
      return new Lambda(new Id(node[1]), parse(['lambda'].concat(node.slice(2))));
    } else if (head === 'lambda') {
      return new Lambda(new Id(node[1]), parse(node[2]));
    } else if (head === 'let') {
      return new Let(new Id(node[1]), parse(node[2]), parse(node[3]));
    } else if (head === 'letrec') {
      return new Letrec(new Id(node[1]), parse(node[2]), parse(node[3]));
    } else if (node.length > 2) {
      return new Apply(parse(node.slice(0, -1)), parse(node.slice(-1)[0]));
    } else {
      return new Apply(parse(node[0]), parse(node[1]));
    }
  } else {
    return new Id(node);
  }
}

// main

[
  ['letrec', 'factorial',
    ['lambda', 'n',
      ['cond', ['zero', 'n'],
        0,
        ['times',
          'n',
          ['factorial', ['pred', 'n']]
        ]
      ]
    ],
    ['factorial', 0]
  ]

  // ['lambda', 'x', ['pair', ['x', 0], ['x', true]]],
  //
  // ['pair', ['f', 0], ['f', true]],
  //
  // ['let', 'f',
  //   ['lambda', 'x', 'x'],
  //   ['pair', ['f', 0], ['f', true]]
  // ],
  //
  // ['lambda', 'f', ['f', 'f']],
  //
  // ['let', 'g',
  //   ['lambda', 'f', 0],
  //   ['g', 'g']
  // ],
  //
  // ['lambda', 'g',
  //   ['let', 'f',
  //     ['lambda', 'x', 'g'],
  //     ['pair', ['f', 0], ['f', true]]
  //   ]
  // ],
  //
  // ['lambda', 'f', 'g', 'a',
  //   ['g', ['f', 'a']]
  // ]
].forEach(tree => {
  let exp = parse(tree);
  console.log(require('util').inspect(exp, { depth: null }));
  try {
    console.log(exp + ' :: ' + analyse(exp, env, new Set()));
  } catch (e) {
    console.log(exp + ' :: ' + (e.message || e));
  }
});
