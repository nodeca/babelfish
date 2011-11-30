BabelFish
=========

Internationaliation with easy syntax for Node.JS
See docs for more details about inline functions.

## Usage

``` javascript
babelfish.addTranslation('ru-RU', 'intro.hello', 'Привет, #{name}!');
babelfish.addTranslation('ru-RU', 'intro.count', 'Вас так %{мало|много}:count!');
babelfish.addTranslation('ru-RU', 'intro.inner.scope', 'Ещё примеры?');

babelfish.translate('ru-RU', 'intro.hello', {name: ixti});
// -> 'Привет, ixti!'

babelfish.translate('ru-RU', 'intro.count', {count: 2});
// -> 'Вас так много!'


babelfish.getTranslation('ru-RU', 'intro');
// -> { hello: 'Привет, #{name}!',
//      count: 'Вас так %{мало|много}:count!' }

babelfish.getTranslation('ru-RU', 'intro', true);
// -> { hello: 'Привет, #{name}!',
//      count: 'Вас так %{мало|много}:count!',
//      inner: { scope: 'Ещё примеры?' } }
```

## YAML

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
      table:
        apples: "Смотри, на столе аж %{целое|целых}:ap_count #{ap_count} %{яблоко|яблока|яблок}:ap_count"
        peaches: >
          Не смотря ни на что, #{user.name} %g{продолжал|продолжала}:user
          поглощать оставшиеся %{персик|персика|персиков}:peaches...
```

## License

View the [LICENSE](https://github.com/nodeca/babelfish.tools/blob/master/LICENSE) file (MIT).
