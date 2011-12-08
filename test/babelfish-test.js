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
    'has `addPhrase()` method'      : Helper.hasFunction('addPhrase'),
    'has `getTranslation()` method' : Helper.hasFunction('getTranslation'),
    'has `setFallback()` method'    : Helper.hasFunction('setFallback'),
    'has `translate()` method'      : Helper.hasFunction('translate'),
    'has `t()` aliase'              : Helper.hasAlias('t', 'translate'),
    'has `defaultLocale` property'  : Helper.hasProperty('defaultLocale')
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

  'Getting translation': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'test.simple_string',    'test');
      i18n.addPhrase('en', 'test.complex.variable', '-#{count}-');
      i18n.addPhrase('en', 'test.complex.plurals',  '-%{foo|bar}.count-');
      i18n.addPhrase('ru', 'test.complex.plurals',  '-%{ruu|bar}.count-');

      return i18n;
    },

    'translation is a String when scope has no macros or variables': function (i18n) {
      var translation = i18n.getTranslation('en', 'test.simple_string');

      Assert.equal(translation.type,  'string');
      Assert.equal(translation.value, 'test');
    },

    'translation has field with original translations string': function (i18n) {
      Assert.equal(i18n.getTranslation('en', 'test.simple_string').orig, 'test');
      Assert.equal(i18n.getTranslation('en', 'test.complex.variable').orig, '-#{count}-');
      Assert.equal(i18n.getTranslation('en', 'test.complex.plurals').orig, '-%{foo|bar}.count-');
      Assert.equal(i18n.getTranslation('ru', 'test.complex.plurals').orig, '-%{ruu|bar}.count-');
    },

    'translation has field with actual locale of translation': function (i18n) {
      Assert.equal(i18n.getTranslation('ru', 'test.simple_string').locale, 'en');
      Assert.equal(i18n.getTranslation('ru', 'test.complex.variable').locale, 'en');
      Assert.equal(i18n.getTranslation('ru', 'test.complex.plurals').locale, 'ru');
    },

    'translation is a Function when scope has macros or variable': function (i18n) {
      ['test.complex.plurals', 'test.complex.variable'].forEach(function (scope) {
        var translation = i18n.getTranslation('en', scope);
        Assert.equal(translation.type, 'function');
        Assert.instanceOf(translation.value, Function);
      });
    },

    'returns inner scope Object when scope requested': function (i18n) {
      var flat = i18n.getTranslation('ru', 'test', {deep: false}),
          deep = i18n.getTranslation('ru', 'test', {deep: true});

      Assert.equal(flat.type, 'object');
      Assert.equal(deep.type, 'object');

      Assert.isUndefined(flat.value.complex);
      Assert.include(flat.value, 'simple_string');

      Assert.include(deep.value, 'simple_string');
      Assert.include(deep.value, 'complex');
      Assert.include(deep.value.complex.value,  'variables');
      Assert.include(deep.value.complex.value,  'plurals');
    }
  },

  'Translating a phrase': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'a', 'a (en)');
      i18n.addPhrase('en', 'b', 'b (en)');
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
    }
  }
}).export(module);
