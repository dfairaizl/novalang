/* nodejs */
const { readFileSync } = require('fs');
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = readFileSync(resolve(__dirname, '..', 'examples', 'modules.nv'));

const novaCompier = new Compiler({ debugGraph: true });
novaCompier.compile(sourceFile);
