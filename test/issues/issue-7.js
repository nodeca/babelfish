'use strict';


var Assert = require('assert');
var BabelFish = require('../..');


module.exports = {
  title: "#7: Zero-count in plurals.",
  fixed: true,
  test: function () {
    var i18n = new BabelFish('ru');
    i18n.addPhrase('ru', 'nailsCount', 'У меня #{n} ((гвоздь|гвоздя|гвоздей)):n');
    Assert.equal(i18n.translate('ru', 'nailsCount', {n: 0}), 'У меня 0 гвоздей');
  }
};
