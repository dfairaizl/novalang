/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'class.nv');

const novaCompier = new Compiler(sourceFile, 'class' /*, { debugGraph: true } */);
novaCompier.compile();
