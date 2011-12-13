'use strict';


var Assert = require('assert');
var Pluralizer = require('../lib/babelfish/pluralizer');


require('vows').describe('BabelFish.Pluralizer').addBatch({
  'en':  function () {
    Assert.equal(Pluralizer.en(1, ['one', 'other']), 'one');
    Assert.equal(Pluralizer.en(2, ['one', 'other']), 'other');
    Assert.equal(Pluralizer.en(1, ['other']), 'other');
  }
}).export(module);
