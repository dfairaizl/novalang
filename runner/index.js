/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "fib.nv");

const novaCompiler = new Compiler(
  sourceFile,
  "fib" /*, { debugGraph: true } */
);

novaCompiler.compile();
