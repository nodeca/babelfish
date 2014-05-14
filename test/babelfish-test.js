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
    });

    it('has `create` (constructor proxy)', function () {
      assert.ok(isFunction(BabelFish.create));
      assert.strictEqual(BabelFish.create.length, BabelFish.length);
      assert.ok(BabelFish.create() instanceof BabelFish);
    });
  });


  describe('Instance', function () {
    var b = new BabelFish();

    it('has methods', function () {
      assert.ok(isFunction(b.addPhrase));
      assert.ok(isFunction(b.getCompiledData));
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
    var b = BabelFish.create('en');

    b.setFallback('es',    ['es-ES', 'es-MX']);
    b.setFallback('es-ES', ['es', 'es-US']);

    b.addPhrase('en',    'aaa', 'aaa (en)');
    b.addPhrase('en',    'bbb', 'bbb (en)');
    b.addPhrase('en',    'ccc', 'ccc (en)');
    b.addPhrase('en',    'ddd', 'ddd (en)');
    b.addPhrase('es',    'aaa', 'aaa (es)');
    b.addPhrase('es-ES', 'bbb', 'bbb (es-ES)');
    b.addPhrase('es-MX', 'ccc', 'ccc (es-MX)');
    b.addPhrase('es-US', 'ddd', 'ddd (es-US)');

    b.setFallback('es-US', ['es']);

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
      b.setFallback('es-US', ['es-ES', 'es-MX']);

      assert.equal(b.t('es', 'aaa'), 'aaa (es)');
      assert.equal(b.t('es', 'bbb'), 'bbb (es-ES)');
      assert.equal(b.t('es', 'ccc'), 'ccc (es-MX)');
      assert.equal(b.t('es', 'ddd'), 'ddd (en)');
    });
  });


  describe('Setting fallback for defaultLocale', function () {
    var b = BabelFish.create('en');

    it('cause exception', function () {
      assert.throws(function () { b.setFallback('en', ['en-GB']); }, Error);
    });
  });


  describe('Adding phrases', function () {
    var b = BabelFish.create('en');

    b.addPhrase('en', 'phrase1',       'foobar');
    b.addPhrase('en', 'scope.phrase2', 'foobar');
    b.addPhrase('en', 'scope',         {phrase3: 'foobar'});

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


  describe('Getting compiled data', function () {
    var b = BabelFish.create('en');

    b.addPhrase('en', 'test.simple_string',    'test');
    b.addPhrase('en', 'test.object',           { foo: 2, bar: 3 }, false);
    b.addPhrase('en', 'test.array',            [ 4, 5, 6 ]);
    b.addPhrase('en', 'test.number',           123);
    b.addPhrase('en', 'test.boolean',          true);
    b.addPhrase('en', 'test.complex.variable', '-#{count}-');
    b.addPhrase('en', 'test.complex.plurals',  '-((foo|bar)):count-');
    b.addPhrase('ru', 'test.complex.plurals',  '-((ruu|bar)):count-');

    it('data is a String when scope has no macros or variables', function () {
      var compiled = b.getCompiledData('en', 'test.simple_string');

      assert.strictEqual(compiled.e, 0);
      assert.equal(compiled.t, 'test');
    });

    // locale is needed on stage of locale recompiling (to override fallback
    // translations if needed)
    it('data has field with actual locale of translation', function () {
      assert.equal(b.getCompiledData('ru', 'test.simple_string').l, 'en');
      assert.equal(b.getCompiledData('ru', 'test.complex.variable').l, 'en');
      assert.equal(b.getCompiledData('ru', 'test.complex.plurals').l, 'ru');
    });

    it('data is a Function when scope has macros or variable', function () {
      var data;
      ['test.complex.plurals', 'test.complex.variable'].forEach(function (scope) {
        data = b.getCompiledData('en', scope);
        assert.strictEqual(data.e, 1);
        assert.ok(isFunction(data.t));
      });
    });

    it('data is a pure object', function () {
      assert.strictEqual(b.getCompiledData('en', 'test.object').l, 'en');
      assert.strictEqual(b.getCompiledData('en', 'test.object').e, 0);
      assert.deepEqual(b.getCompiledData('en', 'test.object').t, { foo: 2, bar: 3 });

      assert.strictEqual(b.getCompiledData('en', 'test.array').l, 'en');
      assert.strictEqual(b.getCompiledData('en', 'test.array').e, 0);
      assert.deepEqual(b.getCompiledData('en', 'test.array').t, [ 4, 5, 6 ]);

      assert.strictEqual(b.getCompiledData('en', 'test.number').l, 'en');
      assert.strictEqual(b.getCompiledData('en', 'test.number').e, 0);
      assert.strictEqual(b.getCompiledData('en', 'test.number').t, 123);

      assert.strictEqual(b.getCompiledData('en', 'test.boolean').l, 'en');
      assert.strictEqual(b.getCompiledData('en', 'test.boolean').e, 0);
      assert.strictEqual(b.getCompiledData('en', 'test.boolean').t, true);
    });

    it('returns inner scope Object when locale only requested', function () {
      var data = b.getCompiledData('ru');

      assert.ok(data);
      assert.ok(data.hasOwnProperty('test.simple_string'));
      assert.ok(data.hasOwnProperty('test.complex.variable'));

      assert.strictEqual(data['test.simple_string'].e, 0);
      assert.strictEqual(data['test.complex.variable'].e, 1);
    });

    it('`getCompiledData()` throws error if locale missed', function () {
      assert.throws(function () { b.getCompiledData(); }, Error);
    });
  });


  describe('Translating a phrase', function () {
    var b = BabelFish.create('en');

    b.addPhrase('en', 'a', 'a (en)');
    b.addPhrase('en', 'b', 'b (en)');
    b.addPhrase('en', 'c', 'c (en) ((one|other)):count');
    b.addPhrase('fr', 'd', 'd (fr) ((une|autre)):count');
    b.addPhrase('ru', 'b', 'b (ru) #{foo}');
    b.addPhrase('es', 'b', 'b (es) #{f.o}');
    b.addPhrase('ru', 'e', [ 4, 5, 6 ]);
    b.addPhrase('en', 'e', { foo: 2, bar: 3 }, false);


    it('returns a string', function () {
      assert.equal(b.t('en', 'a'), 'a (en)');
      assert.equal(b.t('en', 'b'), 'b (en)');
      assert.equal(b.t('ru', 'b', {foo: 'bar'}), 'b (ru) bar');
    });

    it('returns a pure object', function () {
      assert.deepEqual(b.t('ru', 'e'), [ 4, 5, 6 ]);
      assert.deepEqual(b.t('en', 'e'), { foo: 2, bar: 3 });
    });

    it('ignores provided params when they are not needed', function () {
      assert.equal(b.t('en', 'b', {foo: 'bar', bar: 'baz'}), 'b (en)');
    });

    it('replaces missing params with [missed variable: <name>]', function () {
      assert.equal(b.t('ru', 'b'), 'b (ru) [missed variable: foo]');
      assert.equal(b.t('es', 'b'), 'b (es) [missed variable: f.o]');
    });

    it('honors objects in params', function () {
      assert.equal(b.t('es', 'b', {f: {o: 'bar'}}), 'b (es) bar');
    });

    it('reports missing translation', function () {
      assert.equal(b.t('en', 'd', {count: 0}), 'en: No translation for [d]');
    });

    it('honors pluralization', function () {
      assert.equal(b.t('en', 'c', {count: 0}), 'c (en) other');
      assert.equal(b.t('en', 'c', {count: 1}), 'c (en) one');
      assert.equal(b.t('en', 'c', {count: 2}), 'c (en) other');
      assert.equal(b.t('fr', 'c', {count: 0}), 'c (en) other');

      // check that we use correct pluralizer
      assert.equal(b.t('en', 'c', {count: 1}), 'c (en) one');
      assert.equal(b.t('en', 'c', {count: 1.5}), 'c (en) other');
      assert.equal(b.t('fr', 'd', {count: 0}), 'd (fr) une');
      assert.equal(b.t('fr', 'd', {count: 1.5}), 'd (fr) une');
    });

    it('replaces invalid plurals amount with [invalid plurals amount: <name>(<value>)]', function () {
      assert.equal(b.t('en', 'c'), 'c (en) [invalid plurals amount: count(undefined)]');
      assert.equal(b.t('en', 'c', {count: null}), 'c (en) [invalid plurals amount: count(null)]');
      assert.equal(b.t('en', 'c', {count: 'foo'}), 'c (en) [invalid plurals amount: count(foo)]');
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
      var b = BabelFish.create('en');

      b.addPhrase('en', 'test', data);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), true);
    });

    it('flatten level 0', function () {
      var b = BabelFish.create('en');

      b.addPhrase('en', 'test', data, 0);
      assert.equal(b.hasPhrase('en', 'test'), true);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);
    });

    it('flatten level 1', function () {
      var b = BabelFish.create('en');

      b.addPhrase('en', 'test', data, 1);
      assert.equal(b.hasPhrase('en', 'test.foo'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);
    });

    it('flatten level 2', function () {
      var b = BabelFish.create('en');

      b.addPhrase('en', 'test', data, 2);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), false);
    });

    it('flatten level 3', function () {
      var b = BabelFish.create('en');

      b.addPhrase('en', 'test', data, 3);
      assert.equal(b.hasPhrase('en', 'test.foo'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.bar'), true);
      assert.equal(b.hasPhrase('en', 'test.foo.baz'), false);
      assert.equal(b.hasPhrase('en', 'test.foo.baz.bad'), true);
    });

  });

});
