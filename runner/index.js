/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'binop.nv');

const novaCompier = new Compiler(sourceFile, 'binop' /*, { debugGraph: true } */);
novaCompier.compile();
