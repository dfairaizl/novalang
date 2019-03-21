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

1 + 2 * 3

Num(1) -> Op(10) -> Num(2) -> Op(20) -> Num(3)

Sort by op precedence
 Op(20)
 Op(10)

From highest: get predecessor, and successor nodes
  - Op(20)
    - Num(2)
    - Num(3)
  - Op(10)
    - Num(1)
    - Num(2)

       +
     /   \
    1    *
        / \
       2   3

 1. Traverse preorder to find operator
 2. If op: Traverse right, left, recurse to check for more ops
 3. On recursive base case, return leaf
 4. Return to #2
 5.
