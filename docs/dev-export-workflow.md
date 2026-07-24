# Developer Export Workflow

Use this when tuning levels in the in-game developer panel.

1. Open the developer panel in the game.
2. Tune waves, walk zones, level areas, hitboxes, objects, and enemy settings.
3. Press `EXPORT`.
4. The browser downloads `streets-of-russia-dev-export.json` and also prints/copies the same JSON.
5. Apply the export to the working project:

```powershell
npm run apply-dev-export -- path\to\streets-of-russia-dev-export.json
npm run build
npm run check
```

After that, commit `src/config.js` and `src/game.bundle.js`.
