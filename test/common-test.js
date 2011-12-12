'use strict';


var Assert = require('assert');
var Common = require('../lib/babelfish/common');
var Helper = require('./helper');


require('vows').describe('BabelFish.Common').addBatch({
  'flattenParams': {
    'flattens object into single dimension key->value pairs hash': function () {
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
    },

    'tolerate when non-object is given': function () {
      Assert.instanceOf(Common.flattenParams(), Object);
      Assert.instanceOf(Common.flattenParams(null), Object);
      Assert.isNotNull(Common.flattenParams(null));
    }
  },

  'filter': function () {
    var result = Common.filter({
      foo: 1,
      bar: 2,
    }, function even(val, key) {
      return (0 === val % 2);
    });

    Assert.isUndefined(result.foo);
    Assert.equal(result.bar, 2);
  }
}).export(module);
