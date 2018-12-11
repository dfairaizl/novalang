/* nodejs */
const { readFileSync } = require('fs');
const { resolve } = require('path');

const Compiler = require('../compiler');

const sourceFile = readFileSync(resolve(__dirname, '..', 'examples', 'calculator.nv'));

console.log('compiling', sourceFile);

const novaCompier = new Compiler();
novaCompier.compile(sourceFile);
