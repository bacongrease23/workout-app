# TODO — Workout App

## Setup (done)
- [x] Repo folder structure created locally
- [x] Repo initialized in GitHub Desktop
- [x] Repo pushed to GitHub, made public
- [x] GitHub Pages enabled, live at https://bacongrease23.github.io/workout-app/

## Core build
- [ ] `manifest.json` — app name, icons, theme color, display: standalone
- [ ] `icons/icon-192.png` and `icons/icon-512.png`
- [ ] `index.html` — screen structure (home/day selector, workout player, progress log, settings)
- [ ] `css/style.css` — styling, mobile-friendly layout
- [ ] `js/workouts.js` — hardcoded program data (4 days, exercises, sets/timing)
- [ ] `js/timer.js` — work/rest countdown, round tracking, audio tone cues
- [ ] `js/app.js` — screen navigation, wiring it all together
- [ ] `js/progress.js` — log completed workouts (localStorage)
- [ ] `service-worker.js` — offline caching, enables PWA install prompt
- [ ] Exercise illustrations — ~20 simple SVGs in `assets/illustrations/`

## Testing
- [ ] Open live Pages URL on phone browser
- [ ] Confirm "Install app" (Android/Chrome) or "Add to Home Screen" (iOS/Safari) appears
- [ ] Install and test full workout flow end-to-end on phone
- [ ] Test offline mode (airplane mode) once service worker is in place

## Open decisions
- [ ] Confirm injured shoulder side (left/right) — see PRIVATE_NOTES.md
- [ ] Persist progress log across sessions or session-only to start?

## Nice-to-haves (later, optional)
- [ ] Adjustable work/rest timing in Settings
- [ ] Export progress log as text/CSV
- [ ] Dark mode toggle
