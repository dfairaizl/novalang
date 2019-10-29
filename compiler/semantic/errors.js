class ClassNotFoundError extends Error {}
class FunctionNotFoundError extends Error {}
class ImportNotFoundError extends Error {}
class InvalidExportError extends Error {}
class MismatchedReturnTypeError extends Error {}
class MissingTypeAnnotationError extends Error {}
class ModuleNotFound extends Error {}
class NoMatchingModuleExport extends Error {}
class ReassignImmutableError extends Error {}
class TypeMismatchError extends Error {}
class UndeclaredModuleError extends Error {}
class UndeclaredVariableError extends Error {}
class VoidFunctionReturnError extends Error {}

module.exports = {
  ClassNotFoundError,
  FunctionNotFoundError,
  ImportNotFoundError,
  InvalidExportError,
  MismatchedReturnTypeError,
  MissingTypeAnnotationError,
  ModuleNotFound,
  NoMatchingModuleExport,
  ReassignImmutableError,
  TypeMismatchError,
  UndeclaredModuleError,
  UndeclaredVariableError,
  VoidFunctionReturnError
};
