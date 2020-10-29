/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "calculator.nv");

const novaCompier = new Compiler(
  sourceFile,
  "calculator" /*, { debugGraph: true } */
);
novaCompier.compile();
