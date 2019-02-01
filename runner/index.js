/* nodejs */
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = resolve(__dirname, '..', 'examples', 'type.nv');

const novaCompier = new Compiler(sourceFile, 'type', { debugGraph: true });
novaCompier.compile();
