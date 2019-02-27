class FunctionNotFoundError extends Error {}
class ReassignImmutableError extends Error {}
class UndeclaredVariableError extends Error {}

module.exports = {
  FunctionNotFoundError,
  ReassignImmutableError,
  UndeclaredVariableError
};
