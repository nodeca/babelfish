/*global it, describe*/

'use strict';


var expect = require('chai').expect;
var BabelFish = require('../lib/babelfish');

describe('BabelFish', function () {


  describe('API consistence tests', function () {


    describe('Exported module', function () {

      it('is a constructor', function () {
        expect(BabelFish).to.be.a('function');
        expect(new BabelFish()).to.be.instanceOf(BabelFish);
      });

      it('has `create` (constructor proxy)', function () {
        expect(BabelFish.create).to.be.a('function');
        expect(BabelFish.create.length).is.equal(BabelFish.length);
        expect(BabelFish.create()).is.instanceof(BabelFish);
      });
    });


    describe('Instance', function () {
      var b = new BabelFish();

      it('has `addPhrase()` method', function () {
        expect(b.addPhrase).to.be.a('function');
      });

      it('has `getCompiledData()` method', function () {
        expect(b.getCompiledData).to.be.a('function');
      });

      it('has `setFallback()` method', function () {
        expect(b.setFallback).to.be.a('function');
      });

      it('has `translate()` method', function () {
        expect(b.translate).to.be.a('function');
      });

      it('has `t()` alias', function () {
        expect(b.t).is.equal(b.translate);
      });

      it('has `defaultLocale` property', function () {
        expect(b).to.have.property('defaultLocale');
        expect(b.defaultLocale).is.not.a('function');
      });

      it('`defaultLocale` property is read-only', function () {
        expect(function () { b.defaultLocale = 'ru'; }).to.throw(TypeError);
        expect(function () { delete b.defaultLocale; }).to.throw(TypeError);
      });
    });


    describe('New instance with defaults', function () {
      var b = BabelFish.create();

      it('has defaultLocale = `en`', function () {
        expect(b.defaultLocale).is.equal('en');
      });
    });


    describe('New instance with defaultLocale given', function () {
      var b = BabelFish.create('ru');
    
      it('has defaultLocale equal to the specified one', function () {
        expect(b.defaultLocale).is.equal('ru');
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
        expect(b.t('es', 'ddd')).is.equal('ddd (en)');
        expect(b.t('ru', 'ddd')).is.equal('ddd (en)');
      });

      it('allows specify more than one fallback locale', function () {
        expect(b.t('es', 'aaa')).is.equal('aaa (es)');
        expect(b.t('es', 'bbb')).is.equal('bbb (es-ES)');
        expect(b.t('es', 'ccc')).is.equal('ccc (es-MX)');
        expect(b.t('es', 'ddd')).is.equal('ddd (en)');
      });

      it('do not recursively resolve locale fallbacks', function () {
        expect(b.t('es-ES', 'aaa')).is.equal('aaa (es)');
        expect(b.t('es-ES', 'bbb')).is.equal('bbb (es-ES)');
        expect(b.t('es-ES', 'ccc')).is.equal('ccc (en)');
        expect(b.t('es-ES', 'ddd')).is.equal('ddd (es-US)');
      });

      it('allow specify fallbacks after phrases were added', function () {
        expect(b.t('es-US', 'aaa')).is.equal('aaa (es)');
        expect(b.t('es-US', 'bbb')).is.equal('bbb (en)');
        expect(b.t('es-US', 'ccc')).is.equal('ccc (en)');
        expect(b.t('es-US', 'ddd')).is.equal('ddd (es-US)');
      });

      it('allows re-assign fallbacks', function () {
        b.setFallback('es-US', ['es-ES', 'es-MX']);

        expect(b.t('es', 'aaa')).is.equal('aaa (es)');
        expect(b.t('es', 'bbb')).is.equal('bbb (es-ES)');
        expect(b.t('es', 'ccc')).is.equal('ccc (es-MX)');
        expect(b.t('es', 'ddd')).is.equal('ddd (en)');
      });
    });


    describe('Setting fallback for defaultLocale', function () {
      var b = BabelFish.create('en');

      it('cause exception', function () {
        expect(function () { b.setFallback('en', ['en-GB']); })
          .to.throw(Error);
      });
    });


    describe('Adding phrases', function () {
      var b = BabelFish.create('en');

      b.addPhrase('en', 'phrase1',       'foobar');
      b.addPhrase('en', 'scope.phrase2', 'foobar');
      b.addPhrase('en', 'scope',         {phrase3: 'foobar'});

      it('allows specify phrase within `global` scope', function () {
        expect(b.t('en', 'phrase1'))
          .is.equal('foobar');
      });

      it('allows specify phrase prefixed with scope', function () {
        expect(b.t('en', 'scope.phrase2'))
          .is.equal('foobar');
      });

      it('allows specify translations as inner scope', function () {
        expect(b.t('en', 'scope.phrase3'))
          .is.equal('foobar');
      });
    });

    describe('Getting compiled data', function () {
      var b = BabelFish.create('en');

      b.addPhrase('en', 'test.simple_string',    'test');
      b.addPhrase('en', 'test.complex.variable', '-#{count}-');
      b.addPhrase('en', 'test.complex.plurals',  '-((foo|bar)):count-');
      b.addPhrase('ru', 'test.complex.plurals',  '-((ruu|bar)):count-');

      it('data is a String when scope has no macros or variables', function () {
        var compiled = b.getCompiledData('en', 'test.simple_string');

        expect(compiled.type).is.equal('string');
        expect(compiled.translation).is.equal('test');
      });

      // locale is needed on stage of locale recompiling (to override fallback
      // translations if needed)
      it('data has field with actual locale of translation', function () {
        expect(b.getCompiledData('ru', 'test.simple_string').locale)
          .is.equal('en');
        expect(b.getCompiledData('ru', 'test.complex.variable').locale)
          .is.equal('en');
        expect(b.getCompiledData('ru', 'test.complex.plurals').locale)
          .is.equal('ru');
      });

      it('data is a Function when scope has macros or variable', function () {
        var data;
        ['test.complex.plurals', 'test.complex.variable'].forEach(function (scope) {
          data = b.getCompiledData('en', scope);
          expect(data.type).is.equal('function');
          expect(data.translation).to.be.a('function');
        });
      });

      it('returns inner scope Object when locale only requested', function () {
        var data = b.getCompiledData('ru');

        expect(data).is.an('object');

        expect(data).to.have.property('test.simple_string');
        expect(data).to.have.property('test.complex.variable');

        expect(data['test.simple_string'].type)
          .is.equal('string');
        expect(data['test.complex.variable'].type)
          .is.equal('function');
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


      it('always returns a string', function () {
        expect(b.t('en', 'a')).is.equal('a (en)');
        expect(b.t('en', 'b')).is.equal('b (en)');
        expect(b.t('ru', 'b', {foo: 'bar'})).is.equal('b (ru) bar');
      });

      it('ignores provided params when they are not needed', function () {
        expect(b.t('en', 'b', {foo: 'bar', bar: 'baz'}))
          .is.equal('b (en)');
      });

      it('replaces missing params with [missed variable: <name>]', function () {
        expect(b.t('ru', 'b'))
          .is.equal('b (ru) [missed variable: foo]');
        expect(b.t('es', 'b'))
          .is.equal('b (es) [missed variable: f.o]');
      });

      it('honors objects in params', function () {
        expect(b.t('es', 'b', {f: {o: 'bar'}}))
          .is.equal('b (es) bar');
      });

      it('reports missing translation', function () {
        expect(b.t('en', 'd', {count: 0}))
          .is.equal('en: No translation for [d]');
      });

      it('honors pluralization', function () {
        expect(b.t('en', 'c', {count: 0}))
          .is.equal('c (en) other');
        expect(b.t('en', 'c', {count: 1}))
          .is.equal('c (en) one');
        expect(b.t('en', 'c', {count: 2}))
          .is.equal('c (en) other');
        expect(b.t('fr', 'c', {count: 0}))
          .is.equal('c (en) other');

        // check that we use correct pluralizer
        expect(b.t('en', 'c', {count: 1}))
          .is.equal('c (en) one');
        expect(b.t('en', 'c', {count: 1.5}))
          .is.equal('c (en) other');
        expect(b.t('fr', 'd', {count: 0}))
          .is.equal('d (fr) une');
        expect(b.t('fr', 'd', {count: 1.5}))
          .is.equal('d (fr) une');
      });

      it('replaces invalid plurals amount with [invalid plurals amount: <name>(<value>)]', function () {
        expect(b.t('en', 'c'))
          .is.equal('c (en) [invalid plurals amount: count(undefined)]');
        expect(b.t('en', 'c', {count: null}))
          .is.equal('c (en) [invalid plurals amount: count(null)]');
        expect(b.t('en', 'c', {count: "foo"}))
          .is.equal('c (en) [invalid plurals amount: count(foo)]');
      });
    });
  });
});