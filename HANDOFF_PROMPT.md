# Handoff Prompt — Personal Calisthenics Workout PWA

Paste everything below this line into a fresh AI session (Claude, GPT, etc.) to continue this project.

---

## Context
I'm building a free, personal, single-user Progressive Web App (PWA) for 30-minute calisthenics/strength workouts. The full training program and technical spec were already designed in a prior session — nothing about the program design needs to be re-derived, just implemented as code.

## Where things stand (as of handoff)
- Local repo exists at: `C:\Users\jkank\Documents\Health & Wellness\workout-app`
- Folder structure already created:
  ```
  workout-app/
  ├── index.html          (empty, needs content)
  ├── manifest.json        (empty, needs content)
  ├── service-worker.js    (empty, needs content)
  ├── css/style.css        (empty, needs content)
  ├── js/app.js            (empty, needs content)
  ├── js/timer.js          (empty, needs content)
  ├── js/workouts.js       (empty, needs content)
  ├── js/progress.js       (empty, needs content)
  ├── icons/               (empty — needs icon-192.png + icon-512.png)
  ├── assets/illustrations/ (empty — needs ~20 exercise SVGs)
  ├── .gitignore
  └── README.md
  ```
- Repo is on GitHub: **public** repo named `workout-app` under user `bacongrease23`
- GitHub Pages is **live** at: `https://bacongrease23.github.io/workout-app/`
- Deployment pipeline confirmed working (Pages serves whatever is pushed to `main`, root folder)
- Workflow: edit locally in VS Code → commit + push via **GitHub Desktop** → auto-live on the Pages URL
- No backend, no database, no payment anywhere in this pipeline — must stay that way

## What's NOT done yet
- [ ] `index.html` — page structure/screens
- [ ] `manifest.json` — PWA manifest (name, icons, display: standalone, etc.)
- [ ] `service-worker.js` — offline caching, required for install prompt to appear
- [ ] `css/style.css` — styling
- [ ] `js/app.js` — main app logic / screen navigation
- [ ] `js/timer.js` — work/rest interval timer + Web Audio API tone cues
- [ ] `js/workouts.js` — the workout data (see program below)
- [ ] `js/progress.js` — progress log (in-browser storage, e.g. localStorage since this is a plain static site, not a Claude artifact)
- [ ] Icons: 192x192 and 512x512 PNG for `icons/`
- [ ] ~20 simple SVG exercise illustrations for `assets/illustrations/`

## The training program (already designed — implement as-is, do not redesign)

**⚠️ Constraint that must be respected in code/UI, not just design:** User has a 2-year-old rotator cuff injury, still symptomatic. No overhead pressing, no dips, no behind-neck movements, no high-volume pressing anywhere in the program. Include a visible disclaimer in the UI: "Not medical advice — if any movement causes shoulder pain, stop and modify."

4-day split, 30 min/session (5 min warm-up, 20 min main circuit, 5 min finisher):

**Tuesday — Legs & Core (Soccer):**
Warm-up: leg swings, bodyweight squats, walking lunges, hip circles, ankle rolls
Circuit (4 rounds, 40s work/20s rest): goblet squats, walking lunges (DB), single-leg RDL (DB), lateral band walks, Bulgarian split squats
Finisher (2 rounds, 40/20): plank variations, bicycle crunches, dead bugs

**Wednesday — Upper Body (Shoulder-Safe):**
Warm-up: band pull-aparts, arm circles, scapular wall slides, cat-cow
Circuit (4 rounds, 40s/20s): bent-over rows, incline DB chest press, bicep curls, standing overhead triceps extension (light, pain-free range), band external rotations
Finisher: face pulls (band) + prone Y-T-W raises

**Thursday — Boxing Conditioning:**
Warm-up: shadowboxing, jumping jacks, high knees, arm circles
Circuit (4 rounds, 45s/15s): shadowboxing combos, squat jumps, mountain climbers, DB swings (hip-hinge, not overhead), burpees (step-back variant if shoulder flares)
Finisher: jump rope or high knees intervals, 30/30

**Weekend — Full-Body Strength + Mobility:**
Warm-up: full-body dynamic stretch + shoulder CARs
Circuit (4 rounds, 40s/20s): DB deadlifts, single-arm DB rows (bench-supported), goblet squats, glute bridges (DB on hips), band external rotation + pull-apart superset
Finisher: thoracic rotations, hip openers, shoulder dislocates with band (pain-free range)

**Progression rule:** every 2 weeks increase reps, rounds (4→5), or weight — one variable at a time. Any shoulder pain → drop weight or switch to band-only version.

## Suggested build order (to manage token/session budget)
1. `manifest.json` + basic icons — smallest, unblocks PWA installability early
2. `index.html` + `css/style.css` — skeleton UI (day selector, workout player, progress log, settings)
3. `js/workouts.js` — hardcode the program data above into a JS object
4. `js/timer.js` — interval timer engine + Web Audio tones
5. `js/app.js` — wire screens together
6. `js/progress.js` — localStorage-based logging
7. `service-worker.js` — cache all files for offline + trigger install prompt
8. Exercise illustrations (SVG) — can be added incrementally, app should work with placeholders first
9. Test on phone via the live Pages URL, then install as PWA (Chrome: menu → Install app; Safari: Share → Add to Home Screen)

## Full spec reference
See `calisthenics-app-project-plan.md` (from the original planning session) for complete technical spec details, data model, and task breakdown — attach it alongside this handoff if the fresh session doesn't have it.
