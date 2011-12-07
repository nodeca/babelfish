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
    'has `getFallback()` method'    : Helper.hasFunction('getFallback'),
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

      i18n.setFallback('es', 'es-ES', 'es-MX');
      i18n.setFallback('es-ES', 'es', 'es-US');

      i18n.addPhrase('en',    'test.a', '(en)');
      i18n.addPhrase('en',    'test.b', '(en)');
      i18n.addPhrase('en',    'test.c', '(en)');
      i18n.addPhrase('en',    'test.d', '(en)');

      i18n.addPhrase('es',    'test.a', '(es)');
      i18n.addPhrase('es-ES', 'test.b', '(es-ES)');
      i18n.addPhrase('es-MX', 'test.c', '(es-MX)');
      i18n.addPhrase('es-US', 'test.d', '(es-US)');

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
    },

    'do not recursively resolve locale fallbacks': function (i18n) {
      Assert.equal(i18n.t('es-ES', 'test.a'), '(es)');
      Assert.equal(i18n.t('es-ES', 'test.b'), '(es-ES)');
      Assert.equal(i18n.t('es-ES', 'test.c'), '(en)');
      Assert.equal(i18n.t('es-ES', 'test.d'), '(es-US)');
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
      Assert.equal(i18n.t('phrase1'), 'foobar');
    },

    'allows specify phrase prefixed with scope': function (i18n) {
      Assert.equal(i18n.t('scope.phrase2'), 'foobar');
    },

    'allows spicify translations as inner scope': function (i18n) {
      Assert.equal(i18n.t('scope.phrase3'), 'foobar');
    }
  },

  'Getting translation': {
    topic: function () {
      var i18n = BabelFish.create('en');

      i18n.addPhrase('en', 'test.simple_string',    'test');
      i18n.addPhrase('en', 'test.complex.variable', '-#{count}-');
      i18n.addPhrase('en', 'test.complex.plurals',  '-%{foo|bar}.count-');

      return i18n;
    },

    'returns String when scope has no macros or variables': function (i18n) {
      Assert.equal(i18n.getTranslation('ru', 'test.simple_string'), 'test');
    },

    'returns Function when scope has macros or variable': function (i18n) {
      Assert.instanceOf(i18n.getTranslation('ru', 'test.with.plurals'), Function);
      Assert.instanceOf(i18n.getTranslation('ru', 'test.with.variable'), Function);
    },

    'returns inner scope Object when scope requested': function (i18n) {
      var flat = i18n.getTranslation('ru', 'test', {deep: false}),
          deep = i18n.getTranslation('ru', 'test', {deep: true});

      Assert.isUndefined(flat.complex);
      Assert.include(flat,          'simple_string');

      Assert.include(deep,          'simple_string');
      Assert.include(deep,          'complex');
      Assert.include(deep.complex,  'variables');
      Assert.include(deep.complex,  'plurals');
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
