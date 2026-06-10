# Campaign map integration

Скопируй содержимое этого архива в корень проекта `streets-of-russia`.

Нужно добавить в `index.html` два скрипта:

```html
<script src="src/campaignMap.js"></script>
<script src="src/game.js"></script>
<script src="src/campaignMapPatch.js"></script>
```

Важно: `campaignMap.js` должен идти ПЕРЕД `game.js`, а `campaignMapPatch.js` — ПОСЛЕ `game.js`.

После копирования:
```bash
git add assets/map/campaign src/campaignMap.js src/campaignMapPatch.js index.html
git commit -m "Add campaign map progression screen"
git push
```
