/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'mutate.nv');

const novaCompier = new Compiler(sourceFile, 'mutate' /*, { debugGraph: true } */);
novaCompier.compile();
