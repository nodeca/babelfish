var Assert = require('assert'),
    Common = require('../lib/babelfish/common'),
    Helper = require('./helper');


require('vows').describe('BabelFish.Common').addBatch({
  'flattenParams': function () {
    var params = Common.flattenParams({
      foo: {
        bar: {
          baz: 1
        }
      },
      bar: {
        baz: 2
      },
      baz: 3
    });

    Assert.equal(params['foo.bar.baz'], 1);
    Assert.equal(params['bar.baz'],     2);
    Assert.equal(params['baz'],         3);
  }
}).export(module);
