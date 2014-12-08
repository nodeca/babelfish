/*global it, describe*/

'use strict';


var assert = require('assert');
var BabelFish = require('../..');


describe('issue 7', function () {
  it('Numeric 0 in #{variable} should became "0"', function () {
    var b = new BabelFish('ru');

    b.addPhrase('ru', 'n', '#{n}');

    assert.strictEqual(b.translate('ru', 'n', { n: 0 }), '0');
  });
});
