'use strict';


var Assert = require('assert');
var BabelFish = require('../..');


module.exports = {
  title: "#3: Compilation fails.",
  fixed: true,
  test: function () {
    var i18n = new BabelFish();

    Assert.doesNotThrow(function () {
      i18n.addPhrase('en', 'test', 'foo #(bar) baz\n');
    }, SyntaxError);
  }
};
