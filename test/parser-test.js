'use strict';


var Assert = require('assert');
var Parser = require('../lib/babelfish/parser');
var Helper = require('./helper');


require('vows').describe('BabelFish.Parser').addBatch({
  'Parsing simple string': 'TBD',
  'Parsing string with variable': 'TBD',
  'Parsing string with plurals': 'TBD',
  'MACROS_REGEXP': {
    'allows escaped argument separtor as part of argument': 'TBD',
    'allows escaped macros close char as part of argument': 'TBD'
  }
}).export(module);
