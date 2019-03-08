class FunctionNotFoundError extends Error {}
class ImportNotFoundError extends Error {}
class InvalidExportError extends Error {}
class MismatchedReturnTypeError extends Error {}
class MissingTypeAnnotationError extends Error {}
class ModuleNotFound extends Error {}
class ReassignImmutableError extends Error {}
class TypeMismatchError extends Error {}
class UndeclaredVariableError extends Error {}
class VoidAssignmentError extends Error {}
class VoidFunctionReturnError extends Error {}

module.exports = {
  FunctionNotFoundError,
  ImportNotFoundError,
  InvalidExportError,
  MissingTypeAnnotationError,
  MismatchedReturnTypeError,
  ModuleNotFound,
  ReassignImmutableError,
  TypeMismatchError,
  UndeclaredVariableError,
  VoidAssignmentError,
  VoidFunctionReturnError
};
