/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "array.nv");

const novaCompiler = new Compiler(
  sourceFile,
  "array" /*, { debugGraph: true } */
);

novaCompiler.compile();
