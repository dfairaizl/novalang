#!/usr/bin/env node

const readline = require('readline');

const Parser = require('../compiler/parser');

function handle (line) {
  console.log('Handling', line);

  const parser = new Parser(line);
  const sourceNode = parser.parsePrimaryExpression();

  console.log(parser.toAST(sourceNode));
  // parser.parse(line);
  //
  // const curTok = parser.currentToken;
  //
  // if (curTok instanceof DefToken) {
  //   handleDefinition();
  // } else if (curTok instanceof ExternToken) {
  //   handleExtern();
  // } else {
  //   handleTopLevelExpression();
  // }
}

function run () {
  // initCompilerInfrastructure();
  // initJIT();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ready> '
  });

  rl.prompt();

  rl.on('line', (line) => {
    handle(line);

    rl.prompt();
  }).on('close', () => {
    console.log('Cleaning up...');

    // const LLVMIR = libLLVM.LLVMPrintModuleToString(mod);
    // console.log(LLVMIR);

    // libLLVM.LLVMDisposeBuilder(builder);
    // libLLVM.LLVMContextDispose(context);
    // libLLVM.LLVMDisposeModule(mod);

    console.log('Bye');
    process.exit(0);
  });
}

function mainLoop () {
  run();
}

mainLoop();
