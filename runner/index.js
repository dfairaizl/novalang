/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'while.nv');

const novaCompier = new Compiler(sourceFile, 'while' /*, { debugGraph: true } */);
novaCompier.compile();
