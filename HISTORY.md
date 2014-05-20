0.5.0 / 2014-04-20
------------------

- Added variables support in plurals.
- Added zero-form and other strict numbers forms for plurals.
- Coerce number XXX to { count: XXX } in `translate()`;


0.4.0 / 2014-04-19
------------------

- Added objects support. Now `addPhrase()` can also accept `Number`, `Array`,
  `Boolean` and `Object`. That allows to store i18n data for external libs
  (calendars, time/date generators, ...), when flattened keys format is not ok.


0.3.0 / 2014-04-01
------------------

- Added `stringify` method.
- Drop browser build. Use browserify and other tools.
- Changed internal storage format to generate more compact dumps.
- Some speed opts.


0.2.0 / 2013-04-01
------------------

- Drop `defaultLocale` public property.


0.1.3 / 2013-03-19
------------------

- Migrated tests to mocha
- Fixed docs errors
- Added params check to `getCompiledData()`
- Drop `underscore` dependency.
- Change browserifier to `webmake`.


0.1.2 / 2012-10-23
------------------

- Fixed handling 0 in #{variables}, thanks to @elmigranto
- Updated README samples


0.1.1 / 2012-10-15
------------------

- Refactor internal storage
- Fix flattenParams()
- Improved error reporting on missing params
- Add hasPhrase()


0.1.0 / 2012-08-14
------------------

- Initial release
