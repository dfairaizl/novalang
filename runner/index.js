/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "ivars.nv");

const novaCompiler = new Compiler(
  sourceFile,
  "ivars" /*, { debugGraph: true } */
);

novaCompiler.compile();
