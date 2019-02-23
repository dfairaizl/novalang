/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'scope.nv');

const novaCompier = new Compiler(sourceFile, 'scope', { debugGraph: true });
novaCompier.compile();
