'use strict';


var Assert = require('assert');
var BabelFish = require('../lib/babelfish');
var Helper = require('./helper');


require('vows').describe('BabelFish').addBatch({
  // API consistence tests
  'Exported module': {
    'is a constructor': function () {
      Assert.isFunction(BabelFish);
      Assert.instanceOf(new BabelFish, BabelFish);
    },

    'has `create` (constructor proxy)': function () {
      Assert.isFunction(BabelFish.create);
      Assert.equal(BabelFish.create.length, BabelFish.length);
    }
  },

  'Instance': {
    topic: new (BabelFish),
    'has `addPhrase()` method'        : Helper.hasFunction('addPhrase'),
    'has `getCompiledData()` method'  : Helper.hasFunction('getCompiledData'),
    'has `setFallback()` method'      : Helper.hasFunction('setFallback'),
    'has `translate()` method'        : Helper.hasFunction('translate'),
    'has `t()` aliase'                : Helper.hasAlias('t', 'translate'),
    'has `defaultLocale` property'    : Helper.hasProperty('defaultLocale'),

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

      i18n.addPhrase('en',    'test.a', '(en)');
      i18n.addPhrase('en',    'test.b', '(en)');
      i18n.addPhrase('en',    'test.c', '(en)');
      i18n.addPhrase('en',    'test.d', '(en)');

      i18n.addPhrase('es',    'test.a', '(es)');
      i18n.addPhrase('es-ES', 'test.b', '(es-ES)');
      i18n.addPhrase('es-MX', 'test.c', '(es-MX)');
      i18n.addPhrase('es-US', 'test.d', '(es-US)');

      i18n.setFallback('es-US', ['es']);

      return i18n;
    },

    'use defaultLocale in worst case': function (i18n) {
      Assert.equal(i18n.t('es', 'test.d'), '(en)');
      Assert.equal(i18n.t('ru', 'test.d'), '(en)');
    },

    'allows specify more than one fallback locale': function (i18n) {
      Assert.equal(i18n.t('es', 'test.a'), '(es)');
      Assert.equal(i18n.t('es', 'test.b'), '(es-ES)');
      Assert.equal(i18n.t('es', 'test.c'), '(es-MX)');
      Assert.equal(i18n.t('es', 'test.d'), '(en)');
    },

    'do not recursively resolve locale fallbacks': function (i18n) {
      Assert.equal(i18n.t('es-ES', 'test.a'), '(es)');
      Assert.equal(i18n.t('es-ES', 'test.b'), '(es-ES)');
      Assert.equal(i18n.t('es-ES', 'test.c'), '(en)');
      Assert.equal(i18n.t('es-ES', 'test.d'), '(es-US)');
    },

    'allow specify fallbacks after phrases were added': function (i18n) {
      Assert.equal(i18n.t('es-US', 'test.a'), '(es)');
      Assert.equal(i18n.t('es-US', 'test.b'), '(en)');
      Assert.equal(i18n.t('es-US', 'test.c'), '(en)');
      Assert.equal(i18n.t('es-US', 'test.d'), '(es-US)');
    },

    'allows reset fallbacks': function (i18n) {
      i18n.setFallback('es-US', ['es-ES', 'es-MX']);

      Assert.equal(i18n.t('es', 'test.a'), '(es)');
      Assert.equal(i18n.t('es', 'test.b'), '(es-ES)');
      Assert.equal(i18n.t('es', 'test.c'), '(es-MX)');
      Assert.equal(i18n.t('es', 'test.d'), '(en)');
    }
  },

  'Setting fallback for defaultLocale': {
    topic: function () {
      return BabelFish.create('en');
    },
    'cause exception to be thrown': function (i18n) {
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

    'allows spicify translations as inner scope': function (i18n) {
      Assert.equal(i18n.t('en', 'scope.phrase3'), 'foobar');
    }
  },

  'Getting compiled data': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'test.simple_string',    'test');
      i18n.addPhrase('en', 'test.complex.variable', '-#{count}-');
      i18n.addPhrase('en', 'test.complex.plurals',  '-%{foo|bar}:count-');
      i18n.addPhrase('ru', 'test.complex.plurals',  '-%{ruu|bar}:count-');

      return i18n;
    },

    'data is a String when scope has no macros or variables': function (i18n) {
      var translation = i18n.getCompiledData('en', 'test.simple_string');

      Assert.equal(translation.type,  'string');
      Assert.equal(translation.value, 'test');
    },

    'dats has field with actual locale of translation': function (i18n) {
      Assert.equal(i18n.getCompiledData('ru', 'test.simple_string').locale, 'en');
      Assert.equal(i18n.getCompiledData('ru', 'test.complex.variable').locale, 'en');
      Assert.equal(i18n.getCompiledData('ru', 'test.complex.plurals').locale, 'ru');
    },

    'data is a Function when scope has macros or variable': function (i18n) {
      ['test.complex.plurals', 'test.complex.variable'].forEach(function (scope) {
        var translation = i18n.getCompiledData('en', scope);
        Assert.equal(translation.type, 'function', 'type of ' + scope + ' data is function');
        Assert.instanceOf(translation.value, Function, 'value of ' + scope + ' data is Function');
      });
    },

    'returns inner scope Object when scope requested': function (i18n) {
      var flat = i18n.getCompiledData('ru', 'test', {deep: false}),
          deep = i18n.getCompiledData('ru', 'test', {deep: true});

      Assert.equal(flat.type, 'object');
      Assert.equal(deep.type, 'object');

      Assert.isUndefined(flat.value.complex);
      Assert.include(flat.value, 'simple_string');

      Assert.include(deep.value, 'simple_string');
      Assert.include(deep.value, 'complex');
      Assert.include(deep.value.complex.value,  'variable');
      Assert.include(deep.value.complex.value,  'plurals');
    }
  },

  'Translating a phrase': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'a', 'a (en)');
      i18n.addPhrase('en', 'b', 'b (en)');
      i18n.addPhrase('en', 'c', 'c (en) %{one|other}:count');
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

    'replaces missing params with undefined': function (i18n) {
      Assert.equal(i18n.t('ru', 'b'), 'b (ru) <undefined>');
    },

    'honour ojects in params': function (i18n) {
      Assert.equal(i18n.t('es', 'b', {f: {o: 'bar'}}), 'b (es) bar');
    },

    'respect pluralization': function (i18n) {
      Assert.equal(i18n.t('en', 'c', {count: 1}), 'c (en) one');
      Assert.equal(i18n.t('en', 'c', {count: 2}), 'c (en) other');
    }
  },

  'Getting pluralizer': {
    'When locale have own pluralizer': 'TBD',
    'When locale have no pluralizer': 'TBD'
  }
}).export(module);
