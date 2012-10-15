'use strict';


var Assert = require('assert');
var BabelFish = require('../lib/babelfish');


function hasFunction(func) {
  return function (i18n) {
    Assert.isFunction(i18n[func], 'has ' + func + ' function');
  };
}


function hasAlias(alias, original) {
  return function (i18n) {
    Assert.ok(i18n[original] === i18n[alias],
              alias + ' is alias of ' + original);
  };
}


function hasProperty(prop) {
  return function (i18n) {
    Assert.include(i18n, prop, 'has ' + prop + ' property');
    Assert.isFalse('function' === typeof i18n[prop],
                   prop + ' is a scalar or getter');
  };
}


require('vows').describe('BabelFish').addBatch({
  // API consistence tests
  'Exported module': {
    'is a constructor': function () {
      Assert.isFunction(BabelFish);
      Assert.instanceOf(new BabelFish(), BabelFish);
    },

    'has `create` (constructor proxy)': function () {
      Assert.isFunction(BabelFish.create);
      Assert.equal(BabelFish.create.length, BabelFish.length);
      Assert.instanceOf(BabelFish.create(), BabelFish);
    }
  },

  'Instance': {
    topic: new BabelFish(),
    'has `addPhrase()` method'        : hasFunction('addPhrase'),
    'has `getCompiledData()` method'  : hasFunction('getCompiledData'),
    'has `setFallback()` method'      : hasFunction('setFallback'),
    'has `translate()` method'        : hasFunction('translate'),
    'has `t()` aliase'                : hasAlias('t', 'translate'),
    'has `defaultLocale` property'    : hasProperty('defaultLocale'),

    '`defaultLocale` property is read-only': function (i18n) {
      Assert.throws(function () { i18n.defaultLocale = 'ru'; }, TypeError);
      Assert.throws(function () { delete i18n.defaultLocale; }, TypeError);
    }
  },

  'New instance with defaults': {
    topic: function () { return BabelFish.create(); },
    'has defaultLocale = `en`': function (i18n) {
      Assert.equal(i18n.defaultLocale, 'en', 'defaultLocale is en');
    }
  },

  'New instance with defaultLocale given': {
    topic: function () { return BabelFish.create('ru'); },
    'has defaultLocale equal to the specified one': function (i18n) {
      Assert.equal(i18n.defaultLocale, 'ru', 'defaultLocale is ru');
    }
  }
}).addBatch({
  // Behavior and unit tests come here
  'When fallback is given': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.setFallback('es',    ['es-ES', 'es-MX']);
      i18n.setFallback('es-ES', ['es', 'es-US']);

      i18n.addPhrase('en',    'aaa', 'aaa (en)');
      i18n.addPhrase('en',    'bbb', 'bbb (en)');
      i18n.addPhrase('en',    'ccc', 'ccc (en)');
      i18n.addPhrase('en',    'ddd', 'ddd (en)');
      i18n.addPhrase('es',    'aaa', 'aaa (es)');
      i18n.addPhrase('es-ES', 'bbb', 'bbb (es-ES)');
      i18n.addPhrase('es-MX', 'ccc', 'ccc (es-MX)');
      i18n.addPhrase('es-US', 'ddd', 'ddd (es-US)');

      i18n.setFallback('es-US', ['es']);

      return i18n;
    },

    'use defaultLocale in worst case': function (i18n) {
      Assert.equal(i18n.t('es', 'ddd'), 'ddd (en)');
      Assert.equal(i18n.t('ru', 'ddd'), 'ddd (en)');
    },

    'allows specify more than one fallback locale': function (i18n) {
      Assert.equal(i18n.t('es', 'aaa'), 'aaa (es)');
      Assert.equal(i18n.t('es', 'bbb'), 'bbb (es-ES)');
      Assert.equal(i18n.t('es', 'ccc'), 'ccc (es-MX)');
      Assert.equal(i18n.t('es', 'ddd'), 'ddd (en)');
    },

    'do not recursively resolve locale fallbacks': function (i18n) {
      Assert.equal(i18n.t('es-ES', 'aaa'), 'aaa (es)');
      Assert.equal(i18n.t('es-ES', 'bbb'), 'bbb (es-ES)');
      Assert.equal(i18n.t('es-ES', 'ccc'), 'ccc (en)');
      Assert.equal(i18n.t('es-ES', 'ddd'), 'ddd (es-US)');
    },

    'allow specify fallbacks after phrases were added': function (i18n) {
      Assert.equal(i18n.t('es-US', 'aaa'), 'aaa (es)');
      Assert.equal(i18n.t('es-US', 'bbb'), 'bbb (en)');
      Assert.equal(i18n.t('es-US', 'ccc'), 'ccc (en)');
      Assert.equal(i18n.t('es-US', 'ddd'), 'ddd (es-US)');
    },

    'allows re-assign fallbacks': function (i18n) {
      i18n.setFallback('es-US', ['es-ES', 'es-MX']);

      Assert.equal(i18n.t('es', 'aaa'), 'aaa (es)');
      Assert.equal(i18n.t('es', 'bbb'), 'bbb (es-ES)');
      Assert.equal(i18n.t('es', 'ccc'), 'ccc (es-MX)');
      Assert.equal(i18n.t('es', 'ddd'), 'ddd (en)');
    }
  },

  'Setting fallback for defaultLocale': {
    topic: function () {
      return BabelFish.create('en');
    },
    'cause exception': function (i18n) {
      Assert.throws(function () { i18n.setFallback('en', ['en-GB']); }, Error);
    }
  },

  'Adding phrases': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'phrase1',       'foobar');
      i18n.addPhrase('en', 'scope.phrase2', 'foobar');
      i18n.addPhrase('en', 'scope',         {phrase3: 'foobar'});

      return i18n;
    },

    'allows specify phrase within `global` scope': function (i18n) {
      Assert.equal(i18n.t('en', 'phrase1'), 'foobar');
    },

    'allows specify phrase prefixed with scope': function (i18n) {
      Assert.equal(i18n.t('en', 'scope.phrase2'), 'foobar');
    },

    'allows specify translations as inner scope': function (i18n) {
      Assert.equal(i18n.t('en', 'scope.phrase3'), 'foobar');
    }
  },

  'Getting compiled data': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'test.simple_string',    'test');
      i18n.addPhrase('en', 'test.complex.variable', '-#{count}-');
      i18n.addPhrase('en', 'test.complex.plurals',  '-((foo|bar)):count-');
      i18n.addPhrase('ru', 'test.complex.plurals',  '-((ruu|bar)):count-');

      return i18n;
    },

    'data is a String when scope has no macros or variables': function (i18n) {
      var translation = i18n.getCompiledData('en', 'test.simple_string');

      Assert.equal(translation.type,        'string');
      Assert.equal(translation.translation, 'test');
    },

    // locale is needed on stage of locale recompiling (to override fallback
    // translations if needed)
    'data has field with actual locale of translation': function (i18n) {
      Assert.equal(i18n.getCompiledData('ru', 'test.simple_string').locale, 'en');
      Assert.equal(i18n.getCompiledData('ru', 'test.complex.variable').locale, 'en');
      Assert.equal(i18n.getCompiledData('ru', 'test.complex.plurals').locale, 'ru');
    },

    'data is a Function when scope has macros or variable': function (i18n) {
      ['test.complex.plurals', 'test.complex.variable'].forEach(function (scope) {
        var data = i18n.getCompiledData('en', scope);
        Assert.equal(data.type, 'function', 'type of ' + scope + ' data is function');
        Assert.instanceOf(data.translation, Function, 'value of ' + scope + ' data is Function');
      });
    },

    'returns inner scope Object when locale only requested': function (i18n) {
      var data = i18n.getCompiledData('ru');

      Assert.typeOf(data, 'object');

      Assert.include(data, 'test.simple_string');
      Assert.include(data, 'test.complex.variable');

      Assert.equal(data['test.simple_string'].type, 'string');
      Assert.equal(data['test.complex.variable'].type, 'function');
    }
  },

  'Translating a phrase': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'a', 'a (en)');
      i18n.addPhrase('en', 'b', 'b (en)');
      i18n.addPhrase('en', 'c', 'c (en) ((one|other)):count');
      i18n.addPhrase('fr', 'd', 'd (fr) ((une|autre)):count');
      i18n.addPhrase('ru', 'b', 'b (ru) #{foo}');
      i18n.addPhrase('es', 'b', 'b (es) #{f.o}');

      return i18n;
    },

    'always returns a string': function (i18n) {
      Assert.equal(i18n.t('en', 'a'), 'a (en)');
      Assert.equal(i18n.t('en', 'b'), 'b (en)');
      Assert.equal(i18n.t('ru', 'b', {foo: 'bar'}), 'b (ru) bar');
    },

    'ignores provided params when they are not needed': function (i18n) {
      Assert.equal(i18n.t('en', 'b', {foo: 'bar', bar: 'baz'}), 'b (en)');
    },

    'replaces missing params with [missed variable: <name>]': function (i18n) {
      Assert.equal(i18n.t('ru', 'b'), 'b (ru) [missed variable: foo]');
      Assert.equal(i18n.t('es', 'b'), 'b (es) [missed variable: f.o]');
    },

    'honors objects in params': function (i18n) {
      Assert.equal(i18n.t('es', 'b', {f: {o: 'bar'}}), 'b (es) bar');
    },

    'reports missing translation': function (i18n) {
      Assert.equal(i18n.t('en', 'd', {count: 0}), 'en: No translation for [d]');
    },

    'honors pluralization': function (i18n) {
      Assert.equal(i18n.t('en', 'c', {count: 0}), 'c (en) other');
      Assert.equal(i18n.t('en', 'c', {count: 1}), 'c (en) one');
      Assert.equal(i18n.t('en', 'c', {count: 2}), 'c (en) other');
      Assert.equal(i18n.t('fr', 'c', {count: 0}), 'c (en) other');

      // check that we use correct pluralizer
      Assert.equal(i18n.t('en', 'c', {count: 1}),   'c (en) one');
      Assert.equal(i18n.t('en', 'c', {count: 1.5}), 'c (en) other');
      Assert.equal(i18n.t('fr', 'd', {count: 0}),   'd (fr) une');
      Assert.equal(i18n.t('fr', 'd', {count: 1.5}), 'd (fr) une');
    },

    'replaces invalid plurals amount with [invalid plurals amount: <name>(<value>)]': function (i18n) {
      Assert.equal(i18n.t('en', 'c'), 'c (en) [invalid plurals amount: count(undefined)]');
      Assert.equal(i18n.t('en', 'c', {count: null}), 'c (en) [invalid plurals amount: count(null)]');
      Assert.equal(i18n.t('en', 'c', {count: "foo"}), 'c (en) [invalid plurals amount: count(foo)]');
    }
  }
}).export(module);
