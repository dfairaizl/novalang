/* nodejs */
const { resolve } = require("path");

const Compiler = require("../compiler");

const sourceFile = resolve(__dirname, "..", "examples", "modulo.nv");

const novaCompier = new Compiler(
  sourceFile,
  "modulo" /*, { debugGraph: true } */
);
novaCompier.compile();
