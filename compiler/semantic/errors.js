class ClassNotFoundError extends Error {}
class FunctionNotFoundError extends Error {}
class ImportNotFoundError extends Error {}
class InvalidArrayAccessError extends Error {}
class InvalidExportError extends Error {}
class MethodNotFoundError extends Error {}
class MismatchedReturnTypeError extends Error {}
class MissingTypeAnnotationError extends Error {}
class ModuleNotFound extends Error {}
class NoMatchingModuleExport extends Error {}
class ReassignImmutableError extends Error {}
class TypeMismatchError extends Error {}
class UndeclaredInstanceVariableError extends Error {}
class UndeclaredModuleError extends Error {}
class UndeclaredVariableError extends Error {}
class VoidFunctionReturnError extends Error {}

module.exports = {
  ClassNotFoundError,
  FunctionNotFoundError,
  ImportNotFoundError,
  InvalidArrayAccessError,
  InvalidExportError,
  MethodNotFoundError,
  MismatchedReturnTypeError,
  MissingTypeAnnotationError,
  ModuleNotFound,
  NoMatchingModuleExport,
  ReassignImmutableError,
  TypeMismatchError,
  UndeclaredInstanceVariableError,
  UndeclaredModuleError,
  UndeclaredVariableError,
  VoidFunctionReturnError
};
