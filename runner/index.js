/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'fib.nv');

const novaCompier = new Compiler(sourceFile, { debugGraph: true });
novaCompier.compile();
