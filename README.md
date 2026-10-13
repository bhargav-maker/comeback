# StudyFlow - Class 9 Master Blueprint Tracker

Offline-first PWA. 140 CBSE blueprint items, Oct 19 2026 - Jan 7 2027.
Pure HTML/CSS/JS. No frameworks, no servers, no external APIs, no network
required after first load.

## Run it

- PC: double-click `index.html`, OR serve locally (enables full PWA install):
      `npx serve .` or `python -m http.server 8080` then open http://localhost:8080
- Mobile: host the folder once (any static host), open in Chrome ->
  "Add to Home Screen" -> works fully offline like a native app.

## Reseeding after editing the blueprint

1. Edit `blueprintPayload` in `js/seed.js`
2. Change `SEED_VERSION` (e.g. '4' -> '5')
3. Reload - progress resets and the new blueprint is installed.

## Structure

index.html  manifest.webmanifest  sw.js  README.md
css/   base.css  dashboard.css  focusroom.css
js/    app.js  db.js  seed.js  dashboard.js  tasks.js  focusroom.js  notify.js
icons/ icon-192.png  icon-512.png
