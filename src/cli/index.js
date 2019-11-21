#!/usr/bin/env node
const { Signale } = require('signale')
let yargs = require('yargs')

const commands = require('./commands')

const attachLogger = argv => {
  const logger = new Signale({
    logLevel: argv.v ? 'verbose' : 'info',
  })

  return {
    logger,
  }
}

yargs = yargs
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .middleware(attachLogger)

for (const c of Object.values(commands)) {
  yargs = yargs.command(c)
}

yargs
  .demandCommand()
  .help()
  .wrap(72).argv
