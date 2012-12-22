'use strict';


var Assert = require('assert');
var BabelFish = require('../..');


module.exports = {
  title: '#7: Numeric 0 in #{variable} should became "0"',
  fixed: true,
  test: function () {
    var i18n = new BabelFish('ru');
    i18n.addPhrase('ru', 'n', '#{n}');
    Assert.equal(i18n.translate('ru', 'n', {n: 0}), '0');
  }
};
