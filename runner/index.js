/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "binop.nv");

const novaCompiler = new Compiler(
  sourceFile,
  "binop" /*, { debugGraph: true } */
);

novaCompiler.compile();
