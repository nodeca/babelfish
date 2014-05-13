/*global it, describe*/

'use strict';


var assert = require('assert');
var BabelFish = require('../..');


describe('issue 3', function () {
  it('Compilation fails', function () {
    var b = new BabelFish();

    assert.doesNotThrow(function () { b.addPhrase('en', 'test', 'foo #(bar) baz\n'); });
  });
});
