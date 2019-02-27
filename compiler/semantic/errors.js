class FunctionNotFoundError extends Error {}
class MissingTypeAnnotationError extends Error {}
class ReassignImmutableError extends Error {}
class TypeMismatchError extends Error {}
class UndeclaredVariableError extends Error {}

module.exports = {
  FunctionNotFoundError,
  MissingTypeAnnotationError,
  ReassignImmutableError,
  TypeMismatchError,
  UndeclaredVariableError
};
