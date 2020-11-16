/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "max.nv");

const novaCompiler = new Compiler(
  sourceFile,
  "max" /*, { debugGraph: true } */
);

novaCompiler.compile();
