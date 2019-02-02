// a typescript implement of hindley-milner type inference
// reference http://smallshire.org.uk/sufficientlysmall/2010/04/11/a-hindley-milner-type-inference-implementation-in-python/
/// <reference path="./lib.es6.d.ts" />
var Id = /** @class */ (function () {
    function Id(name) {
        this.name = name;
    }
    Id.prototype.toString = function () { return this.name; };
    return Id;
}());
var Lambda = /** @class */ (function () {
    function Lambda(arg, body) {
        this.arg = arg;
        this.body = body;
    }
    Lambda.prototype.toString = function () { return "(fn " + this.arg + " => " + this.body + ")"; };
    return Lambda;
}());
var Apply = /** @class */ (function () {
    function Apply(func, arg) {
        this.func = func;
        this.arg = arg;
    }
    Apply.prototype.toString = function () { return "(" + this.func + " " + this.arg + ")"; };
    return Apply;
}());
var Let = /** @class */ (function () {
    function Let(variable, value, body) {
        this.variable = variable;
        this.value = value;
        this.body = body;
    }
    Let.prototype.toString = function () { return "(let " + this.variable + " = " + this.value + " in " + this.body + ")"; };
    return Let;
}());
var Letrec = /** @class */ (function () {
    function Letrec(variable, value, body) {
        this.variable = variable;
        this.value = value;
        this.body = body;
    }
    Letrec.prototype.toString = function () { return "(letrec " + this.variable + " = " + this.value + " in " + this.body + ")"; };
    return Letrec;
}());
var TypeVariable = /** @class */ (function () {
    function TypeVariable() {
    }
    TypeVariable.prototype.toString = function () {
        return this.instance ? this.instance.toString() : this.name;
    };
    Object.defineProperty(TypeVariable.prototype, "name", {
        get: function () {
            return this._name || (this._name = 't' + (TypeVariable.lastNameIndex++));
        },
        enumerable: true,
        configurable: true
    });
    TypeVariable.lastNameIndex = 0;
    return TypeVariable;
}());
var TypeOperator = /** @class */ (function () {
    function TypeOperator(name, types) {
        this.name = name;
        this.types = types;
    }
    TypeOperator.prototype.toString = function () {
        if (this.types.length === 0)
            return this.name;
        else if (this.types.length === 2)
            return "(" + this.types[0] + " " + this.name + " " + this.types[1] + ")";
        else
            return this.name + " " + this.types.join(' ');
    };
    return TypeOperator;
}());
var IntegerType = new TypeOperator('int', []);
var BoolType = new TypeOperator('bool', []);
var FunctionType = function (from, to) { return new TypeOperator('->', [from, to]); };
// ...
var TypeEnv = /** @class */ (function () {
    function TypeEnv(map) {
        if (map === void 0) { map = {}; }
        this.map = map;
    }
    TypeEnv.prototype.get = function (name, nonGenerics) {
        if (name in this.map)
            return fresh(this.map[name], nonGenerics);
        throw 'undefined symbol: ' + name;
    };
    TypeEnv.prototype.extend = function (name, val) {
        var _a;
        return new TypeEnv(Object.assign({}, this.map, (_a = {}, _a[name] = val, _a)));
    };
    return TypeEnv;
}());
function analyse(node, env, nonGeneric) {
    if (node instanceof Id) {
        return env.get(node.name, nonGeneric);
    }
    else if (node instanceof Apply) {
        var funcType = analyse(node.func, env, nonGeneric), argType = analyse(node.arg, env, nonGeneric), retType = new TypeVariable();
        unify(FunctionType(argType, retType), funcType);
        return retType;
    }
    else if (node instanceof Lambda) {
        var argType = new TypeVariable(), newEnv = env.extend(node.arg, argType), newGeneric = new Set(Array.from(nonGeneric).concat(argType)), retType = analyse(node.body, newEnv, newGeneric);
        return FunctionType(argType, retType);
    }
    else if (node instanceof Let) {
        var valType = analyse(node.value, env, nonGeneric), newEnv = env.extend(node.variable, valType);
        return analyse(node.body, newEnv, nonGeneric);
    }
    else if (node instanceof Letrec) {
        var newType = new TypeVariable(), newEnv = env.extend(node.variable, newType), newGeneric = new Set(Array.from(nonGeneric).concat(newType)), valType = analyse(node.value, newEnv, newGeneric);
        unify(newType, valType);
        return analyse(node.body, newEnv, nonGeneric);
    }
    else {
        throw 'unhandled syntax node ' + node;
    }
}
function fresh(type, nonGeneric) {
    var mappings = new WeakMap();
    function freshrec(type) {
        type = prune(type);
        if (type instanceof TypeVariable) {
            if (isGeneric(type, nonGeneric)) {
                if (!mappings.has(type))
                    mappings.set(type, new TypeVariable());
                return mappings.get(type);
            }
            else {
                return type;
            }
        }
        else if (type instanceof TypeOperator) {
            return new TypeOperator(type.name, type.types.map(freshrec));
        }
        else {
            throw 'unexpected type to fresh';
        }
    }
    return freshrec(type);
}
function unify(type1, type2) {
    var t1 = prune(type1), t2 = prune(type2);
    if (t1 instanceof TypeVariable) {
        if (t1 !== t2) {
            if (occursInType(t1, t2))
                throw 'recurive unification';
            t1.instance = t2;
        }
    }
    else if (t1 instanceof TypeOperator && t2 instanceof TypeVariable) {
        return unify(t2, t1);
    }
    else if (t1 instanceof TypeOperator && t2 instanceof TypeOperator) {
        if (t1.name !== t2.name || t1.types.length !== t2.types.length)
            throw 'type mismatch: ' + t1 + ' != ' + t2;
        t1.types.forEach(function (t, i) { return unify(t1.types[i], t2.types[i]); });
    }
    else {
        throw 'unexpected types to unify';
    }
}
function prune(type) {
    if (type instanceof TypeVariable && type.instance)
        return type.instance = prune(type.instance);
    return type;
}
function isGeneric(type, nonGenerics) {
    return !occursInTypes(type, Array.from(nonGenerics));
}
function occursInType(type, typeIn) {
    typeIn = prune(typeIn);
    if (typeIn === type)
        return true;
    else if (typeIn instanceof TypeOperator)
        return occursInTypes(type, typeIn.types);
    return false;
}
function occursInTypes(type, types) {
    return types.some(function (t) { return occursInType(type, t); });
}
// ...
var type1 = new TypeVariable(), type2 = new TypeVariable(), type3 = new TypeVariable();
var env = new TypeEnv({
    pair: FunctionType(type1, FunctionType(type2, new TypeOperator('*', [type1, type2]))),
    cond: FunctionType(BoolType, FunctionType(type3, FunctionType(type3, type3))),
    zero: FunctionType(IntegerType, BoolType),
    pred: FunctionType(IntegerType, IntegerType),
    times: FunctionType(IntegerType, FunctionType(IntegerType, IntegerType)),
    0: IntegerType,
    "true": BoolType
});
function parse(node) {
    if (Array.isArray(node)) {
        var head = node[0];
        if (head === 'lambda' && node.length > 3)
            return new Lambda(new Id(node[1]), parse(['lambda'].concat(node.slice(2))));
        else if (head === 'lambda')
            return new Lambda(new Id(node[1]), parse(node[2]));
        else if (head === 'let')
            return new Let(new Id(node[1]), parse(node[2]), parse(node[3]));
        else if (head === 'letrec')
            return new Letrec(new Id(node[1]), parse(node[2]), parse(node[3]));
        else if (node.length > 2)
            return new Apply(parse(node.slice(0, -1)), parse(node.slice(-1)[0]));
        else
            return new Apply(parse(node[0]), parse(node[1]));
    }
    else {
        return new Id(node);
    }
}
;
[
    ['letrec', 'factorial',
        ['lambda', 'n',
            ['cond', ['zero', 'n'],
                0,
                ['times',
                    'n',
                    ['factorial', ['pred', 'n']]
                ],
            ]
        ],
        ['factorial', 0],
    ],
    ['lambda', 'x', ['pair', ['x', 0], ['x', true]]],
    ['pair', ['f', 0], ['f', true]],
    ['let', 'f',
        ['lambda', 'x', 'x'],
        ['pair', ['f', 0], ['f', true]],
    ],
    ['lambda', 'f', ['f', 'f']],
    ['let', 'g',
        ['lambda', 'f', 0],
        ['g', 'g'],
    ],
    ['lambda', 'g',
        ['let', 'f',
            ['lambda', 'x', 'g'],
            ['pair', ['f', 0], ['f', true]],
        ],
    ],
    ['lambda', 'f', 'g', 'a',
        ['g', ['f', 'a']],
    ],
].forEach(function (tree) {
    var exp = parse(tree);
    try {
        console.log(exp + ' :: ' + analyse(exp, env, new Set()));
    }
    catch (e) {
        console.log(exp + ' :: ' + (e.message || e));
    }
});
