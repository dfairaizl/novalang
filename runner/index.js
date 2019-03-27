/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'dowhile.nv');

const novaCompier = new Compiler(sourceFile, 'dowhile' /*, { debugGraph: true } */);
novaCompier.compile();
