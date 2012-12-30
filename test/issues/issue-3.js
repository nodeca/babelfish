/*global it, describe*/

'use strict';


var expect = require('chai').expect;
var BabelFish = require('../..');


describe('issue 3', function () {
  it('Compilation fails', function () {
    var b = new BabelFish();

    expect(function () { b.addPhrase('en', 'test', 'foo #(bar) baz\n'); })
      .to.not.throw(SyntaxError);
  });
});
