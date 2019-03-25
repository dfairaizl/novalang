/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'if.nv');

const novaCompier = new Compiler(sourceFile, 'if' /*, { debugGraph: true } */);
novaCompier.compile();
