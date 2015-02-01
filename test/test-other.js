/*global it, describe*/

'use strict';


var assert = require('assert');
var BabelFish = require('../lib/babelfish');

var isFunction = function isFunction(obj) {
  return Object.prototype.toString.call(obj) === '[object Function]';
};


describe('API consistence tests', function () {

  describe('Exported module', function () {

    it('is a constructor', function () {
      assert.ok(isFunction(BabelFish));
      assert.ok((new BabelFish()) instanceof BabelFish);
      /*eslint-disable new-cap*/
      assert.ok(BabelFish() instanceof BabelFish);
    });
  });


  describe('Instance', function () {
    var b = new BabelFish();

    it('has methods', function () {
      assert.ok(isFunction(b.addPhrase));
      assert.ok(isFunction(b.setFallback));
      assert.ok(isFunction(b.translate));
    });

    it('has `t()` alias', function () {
      assert.strictEqual(b.t, b.translate);
    });
  });
});


describe('Behavior and unit tests come here', function () {

  describe('When fallback is given', function () {
    var b = new BabelFish('en');

    b.setFallback('es',    [ 'es-ES', 'es-MX' ]);
    b.setFallback('es-ES', [ 'es', 'es-US' ]);

    b.addPhrase('en',    'aaa', 'aaa (en)');
    b.addPhrase('en',    'bbb', 'bbb (en)');
    b.addPhrase('en',    'ccc', 'ccc (en)');
    b.addPhrase('en',    'ddd', 'ddd (en)');
    b.addPhrase('es',    'aaa', 'aaa (es)');
    b.addPhrase('es-ES', 'bbb', 'bbb (es-ES)');
    b.addPhrase('es-MX', 'ccc', 'ccc (es-MX)');
    b.addPhrase('es-US', 'ddd', 'ddd (es-US)');

    b.setFallback('es-US', 'es');

    it('use defaultLocale in worst case', function () {
      assert.equal(b.t('es', 'ddd'), 'ddd (en)');
      assert.equal(b.t('ru', 'ddd'), 'ddd (en)');
    });

    it('allows specify more than one fallback locale', function () {
      assert.equal(b.t('es', 'aaa'), 'aaa (es)');
      assert.equal(b.t('es', 'bbb'), 'bbb (es-ES)');
      assert.equal(b.t('es', 'ccc'), 'ccc (es-MX)');
      assert.equal(b.t('es', 'ddd'), 'ddd (en)');
    });

    it('do not recursively resolve locale fallbacks', function () {
      assert.equal(b.t('es-ES', 'aaa'), 'aaa (es)');
      assert.equal(b.t('es-ES', 'bbb'), 'bbb (es-ES)');
      assert.equal(b.t('es-ES', 'ccc'), 'ccc (en)');
      assert.equal(b.t('es-ES', 'ddd'), 'ddd (es-US)');
    });

    it('allow specify fallbacks after phrases were added', function () {
      assert.equal(b.t('es-US', 'aaa'), 'aaa (es)');
      assert.equal(b.t('es-US', 'bbb'), 'bbb (en)');
      assert.equal(b.t('es-US', 'ccc'), 'ccc (en)');
      assert.equal(b.t('es-US', 'ddd'), 'ddd (es-US)');
    });

    it('allows re-assign fallbacks', function () {
      b.setFallback('es-US', [ 'es-ES', 'es-MX' ]);

      assert.equal(b.t('es', 'aaa'), 'aaa (es)');
      assert.equal(b.t('es', 'bbb'), 'bbb (es-ES)');
      assert.equal(b.t('es', 'ccc'), 'ccc (es-MX)');
      assert.equal(b.t('es', 'ddd'), 'ddd (en)');
    });
  });


  describe('Setting fallback for defaultLocale', function () {
    var b = new BabelFish('en');

    it('cause exception', function () {
      assert.throws(function () { b.setFallback('en', 'en-GB'); }, Error);
    });
  });


  describe('Adding phrases', function () {
    var b = new BabelFish('en');

    b.addPhrase('en', 'phrase1',       'foobar');
    b.addPhrase('en', 'scope.phrase2', 'foobar');
    b.addPhrase('en', 'scope',         { phrase3: 'foobar' });

    it('allows specify phrase within `global` scope', function () {
      assert.equal(b.t('en', 'phrase1'), 'foobar');
    });

    it('allows specify phrase prefixed with scope', function () {
      assert.equal(b.t('en', 'scope.phrase2'), 'foobar');
    });

    it('allows specify translations as inner scope', function () {
      assert.equal(b.t('en', 'scope.phrase3'), 'foobar');
    });
  });


  describe('Store non strings', function () {

    it('returns a pure object', function () {
      var b = new BabelFish('en');
      b.addPhrase('en', 'a', { foo: 2, bar: 3 }, false);
      b.addPhrase('en', 'b', [ 4, 5, 6 ]);
      b.addPhrase('en', 'c', 123);
      b.addPhrase('en', 'd', true);

      assert.deepEqual(b.t('en', 'a'), { foo: 2, bar: 3 });
      assert.deepEqual(b.t('en', 'b'), [ 4, 5, 6 ]);
      assert.strictEqual(b.t('en', 'c'), 123);
      assert.strictEqual(b.t('en', 'd'), true);

      assert.throws(function () {
        b.addPhrase('en', 'invalid', /abc/);
      });
    });

  });


  describe('Flatten checks', function () {
    var data = {
      foo: {
        bar: 3,
        baz: {
          bad: 4
        }
      }
    };

    it('default flatten', function () {
      var b = new BabelFish('en');

      b.addPhrase('en', 'test', data);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), true);
    });

    it('flatten level 0', function () {
      var b = new BabelFish('en');

      b.addPhrase('en', 'test', data, 0);
      assert.equal(b.hasPhrase('en', 'test'), true);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);

      b = new BabelFish('en');

      b.addPhrase('en', 'test', data, false);
      assert.equal(b.hasPhrase('en', 'test'), true);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);
    });

    it('flatten level 1', function () {
      var b = new BabelFish('en');

      b.addPhrase('en', 'test', data, 1);
      assert.equal(b.hasPhrase('en', 'test.foo'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);
    });

    it('flatten level 2', function () {
      var b = new BabelFish('en');

      b.addPhrase('en', 'test', data, 2);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);
    });

    it('flatten level 3', function () {
      var b = new BabelFish('en');

      b.addPhrase('en', 'test', data, 3);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), true);
    });

    it('flatten level - infinite', function () {
      var b = new BabelFish('en');

      b.addPhrase('en', 'test', data, true);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), true);
    });

    it('invalid flatten', function () {
      var b = new BabelFish('en');

      assert.throws(function () { b.addPhrase('en', 'test', data, -1); });
    });

  });


  describe('Serialization', function () {
    var b = new BabelFish('en');
    b.addPhrase('en', 'string', 'test');
    b.addPhrase('en', 'number', 123);
    b.addPhrase('ru', 'object', { foo: 'bar' }, 0);

    b.setFallback('ua', 'ru');

    var data_ua = {
      fallback: { ua: [ 'ru' ] },
      locales: {
        en: { string: 'test', number: 123 },
        ru: { object: { foo: 'bar' } }
      }
    };

    var data_ru = {
      fallback: {},
      locales: {
        en: { string: 'test', number: 123 },
        ru: { object: { foo: 'bar' } }
      }
    };

    var data_en = {
      fallback: {},
      locales: {
        en: { string: 'test', number: 123 }
      }
    };

    it('stringify', function() {
      assert.deepEqual(JSON.parse(b.stringify('ru')), data_ru);
      assert.deepEqual(JSON.parse(b.stringify('en')), data_en);
    });

    it('load', function() {
      var b_new = new BabelFish('en');
      b_new.load(b.stringify('ru'));
      assert.deepEqual(JSON.parse(b_new.stringify('ru')), data_ru);

      b_new = new BabelFish('en');
      b_new.load(b.stringify('en'));
      assert.deepEqual(JSON.parse(b_new.stringify('en')), data_en);
    });

    it('load object', function() {
      var b_new = new BabelFish('en');
      b_new.load(b.stringify('ru'));
      assert.deepEqual(JSON.parse(b_new.stringify('ru')), data_ru);

      b_new = new BabelFish('en');
      b_new.load(JSON.parse(b.stringify('en')));
      assert.deepEqual(JSON.parse(b_new.stringify('en')), data_en);

      b_new = new BabelFish('en');
      b_new.load(JSON.parse(b.stringify('ua')));
      assert.deepEqual(JSON.parse(b_new.stringify('ua')), data_ua);
    });
  });


  describe('Misc', function () {

    it('Unknown locale (no pluralizer)', function () {
      var b = new BabelFish();

      b.addPhrase('bad', 'test', '((1|2))');
      assert.equal(b.t('bad', 'test', 5), '[pluralizer for "bad" locale not found]');
    });

    it('Auto add default locale to fallbacks end', function () {
      var b1 = new BabelFish();
      var b2 = new BabelFish();

      b1.setFallback('ua', [ 'ru' ]);
      b2.setFallback('ua', [ 'ru', 'en' ]);
      assert.deepEqual(b1._fallbacks, b2._fallbacks);
    });

    it('Don\'t add macros from plurals to cache twice', function () {
      var b = new BabelFish();

      b.addPhrase('en', 't1', '1 ((#{count} nail|#{count} nails|=5 five [#{count}] nails))');
      b.addPhrase('en', 't2', '2 ((#{count} nail|#{count} nails|=5 five [#{count}] nails))');

      assert.equal(b.t('en', 't1', 5), '1 five [5] nails');
      assert.equal(b.t('en', 't2', 5), '2 five [5] nails');
    });
  });

});
