class FunctionNotFoundError extends Error {}
class MissingTypeAnnotationError extends Error {}
class MismatchedReturnTypeError extends Error {}
class ReassignImmutableError extends Error {}
class TypeMismatchError extends Error {}
class UndeclaredVariableError extends Error {}
class VoidFunctionReturnError extends Error {}

module.exports = {
  FunctionNotFoundError,
  MissingTypeAnnotationError,
  MismatchedReturnTypeError,
  ReassignImmutableError,
  TypeMismatchError,
  UndeclaredVariableError,
  VoidFunctionReturnError
};
