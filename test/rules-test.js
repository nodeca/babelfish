'use strict';


var Assert = require('assert');
var Rules = require('../lib/babelfish/rules');
var Helper = require('./helper');


require('vows').describe('BabelFish.Rules').addBatch({
  'en': {
    topic: function () { return Rules.en.pluralize; },
    'pluralize()': function (p) {
      Assert.equal(p(1, ['one', 'other']), 'one');
      Assert.equal(p(2, ['one', 'other']), 'other');
      Assert.equal(p(1, ['other']), 'other');
    }
  }
}).export(module);
