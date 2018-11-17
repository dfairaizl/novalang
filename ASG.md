### Parsed to Application Source Graph

Module[Math]->sources[0] = Const('PI', 'float', 3.14)
Module[Math]->sources[1] =
  Closure('PI')->Function('rad', [Arg('deg', 'integer')])->sources[0] = BinaryExpr('*', 'PI', BinaryExpr('/', 'deg', 180.0))

Math.nv:

const PI = 3.14

function rad(deg) {
  return deg / 180.0 * PI;
}

Graph traversals + weighted relationships to the operations can be used to determine operator precedence and for type checking.
