#!/usr/bin/env node

'use strict';

/* eslint-env es6 */

const { execSync } = require('child_process');

const head = execSync('git show-ref --hash HEAD', { encoding: 'utf8' }).slice(0, 6);

const link_format = `https://github.com/{package.repository}/blob/${head}/{file}#L{line}`;

const result = execSync(`node node_modules/.bin/ndoc --link-format "${link_format}"`, { encoding: 'utf8' });

/* eslint-disable no-console */
console.log(result.trim());
