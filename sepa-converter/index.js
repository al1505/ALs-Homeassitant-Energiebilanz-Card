#!/usr/bin/env node
'use strict';

const path = require('path');
const { startWatcher } = require('./src/watcher');

const baseDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

startWatcher(baseDir);
