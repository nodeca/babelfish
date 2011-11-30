BabelFish
=========

Internationaliation with easy syntax for Node.JS
See docs for more details about inline functions.


## Phrases Syntax

-  `#{varname}` Echoes value of variable
-  `%{Singular|Plural1|Plural2}:myvar` Plural form
   -  outputs appropriate form according to `length` or `count` property variable
   -  one may pass count (`length` property) directly (as an integer)
   -  you can use `@@` within plural forms to refer to the variable's count

```
А у меня в кармане #{nails.length} %{гвоздь|гвоздя|гвоздей}.nails
А у меня в кармане %{один гвоздь|@@ гвоздя|@@ гвоздей}.nails
```


#### Example with YAML

As BabelFish supports scopes, it's really fun and nice to store translations in
YAML files:

``` yaml
---
ru-RU:
  profile: Профиль
  forums: Форумы
  apps:
    forums:
      new_topic: Новая тема
      last_post:
        title : Последнее сообщение
        by : от
  demo:
    apples: >
      Смотри, #{name}, на столе лежит %{одно красное|аж целых @@ красных}:apples
      %{яблоко|яблока|яблок}:apples.count"
```


## Usage

``` javascript
// Create new instance of BabelFish with default lnguage/locale: 'en'
var i18n = require('babelfish').create('en-GB');


// Fill in some phrases
i18n.addPhrase('en-GB', 'demo.hello',         'Hello, #{user.name}.');
i18n.addPhrase('en-GB', 'demo.conv.wazup',    'Whats up?');
i18n.addPhrase('en-GB', 'demo.conv.alright',  'Alright, man!');

i18n.addPhrase('ru-RU', 'demo.hello',         'Привет, #{user.name}.');
i18n.addPhrase('ru-RU', 'demo.conv.wazup',    'Как дела?');

i18n.addPhrase('uk-UA', 'demo.hello',         'Здоровенькі були, #{user.name}.');


// Set locale fallback so we use most appropriate translation
i18n.setLocaleFallback('uk-UA', 'ru-RU');


// Translate
var params = {user: {name: 'ixti'}};

i18n.t('ru-RU', 'demo.hello', params);  // -> 'Привет, ixti.'
i18n.t('ru-RU', 'demo.conv.wazup');     // -> 'Как дела?'
i18n.t('ru-RU', 'demo.conv.alright');   // -> 'Alright, man!'

i18n.t('uk-UA', 'demo.hello', params);  // -> 'Здоровенькі були, ixti.'
i18n.t('uk-UA', 'demo.conv.wazup');     // -> 'Как дела?'
i18n.t('uk-UA', 'demo.conv.alright');   // -> 'Alright, man!'


// Get compiled phrase or all phrases within scope.
i18n.getCompiledPhrase('ru-RU', 'demo');
// -> { hello : [Function],
//      conv  : { wazup   : 'Как дела?',
//                alright : 'Alright, man!' } }

i18n.getCompiledPhrase('ru-RU', 'demo.hello');
// -> [Function]


// You may want to get translations within only one level of the scope
i18n.getCompiledPhrase('ru-RU', 'demo', {deep: false});
// -> { hello : [Function] }
```


## License

View the [LICENSE](https://github.com/nodeca/babelfish.tools/blob/master/LICENSE) file (MIT).
