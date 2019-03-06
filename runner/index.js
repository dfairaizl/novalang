/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'main.nv');

const novaCompier = new Compiler(sourceFile, 'main', { debugGraph: true });
novaCompier.compile();
