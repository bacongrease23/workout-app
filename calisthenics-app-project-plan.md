# Project: Personal 30-Min Calisthenics/Strength App

## Role of this document
This is the master spec. Hand this whole file to any AI coding assistant (Claude, GPT, etc.) and say "build this." It contains (1) the actual training program, already designed for this person's goals/constraints, and (2) the technical/app spec. Nothing about the program itself needs to be re-derived — just implemented.

---

## 1. Person profile (context for whoever builds/adjusts this)
- Intermediate calisthenics/strength level (comfortable with pull-ups, dips — but currently detrained/out of shape)
- Goals: fat loss (love handles, abdominal fat), preserve/rebuild leg muscle (ex-soccer player), build arm size/strength (biceps/triceps insecurity), general functional strength + endurance
- **Injury: rotator cuff + surrounding muscles, right/left unspecified, from a car accident ~2 years ago, still symptomatic.** This is a hard constraint, not a preference.
- Style preference: soccer & boxing-flavored conditioning
- Equipment: dumbbells up to 55 lb, mat, resistance bands, bench, bodyweight. No pull-up bar.
- Schedule: Tuesday, Wednesday, Thursday, + one weekend day (4 days/week)
- Session length: 30 minutes including warm-up

**⚠️ Standing note for any builder/AI touching this program:** Do not add overhead pressing, dips, behind-neck movements, or high-volume pressing without a shoulder-cleared checkpoint. Favor rows, external rotation work, scapular stability, and controlled tempo. This person has not necessarily been cleared by a physical therapist — the program is built conservatively, but it is not a substitute for medical/PT guidance. Include a visible in-app disclaimer: "Not medical advice — if any movement causes shoulder pain, stop and modify."

---

## 2. The Program

### Structure: 4-day split, 30 min/session
| Day | Name | Focus |
|---|---|---|
| Tue | Legs & Core (Soccer) | Single-leg strength, explosive-controlled power, core |
| Wed | Upper Body (Shoulder-Safe) | Rows, curls, triceps, rotator cuff prehab — no overhead pressing |
| Thu | Boxing Conditioning | Full-body interval circuit, fat-loss focused |
| Weekend | Full-Body Strength + Mobility | Compound strength + rotator cuff/shoulder mobility maintenance |

Each session format:
- **Warm-up: 5 min** (dynamic, joint-specific — shoulders get extra prep on all days)
- **Main circuit: 20 min**
- **Finisher/core or cooldown: 5 min**

### Day 1 — Tuesday: Legs & Core (Soccer)
**Warm-up (5 min):** leg swings, bodyweight squats, walking lunges, hip circles, ankle rolls

**Main circuit (20 min) — 4 rounds, 40s work / 20s rest per exercise:**
1. Dumbbell goblet squats
2. Walking lunges (holding dumbbells)
3. Single-leg Romanian deadlift (dumbbell)
4. Lateral band walks
5. Bulgarian split squats (rear foot on bench)

**Finisher (5 min):** core — plank variations, bicycle crunches, dead bugs (2 rounds, 40/20)

### Day 2 — Wednesday: Upper Body (Shoulder-Safe)
**Warm-up (5 min):** band pull-aparts, arm circles (small→large), scapular wall slides, cat-cow

**Main circuit (20 min) — 4 rounds, 40s work / 20s rest:**
1. Dumbbell bent-over rows
2. Incline dumbbell chest press (bench inclined — easier on the front of the shoulder than flat/overhead)
3. Dumbbell bicep curls
4. Standing overhead triceps extension (light weight, pain-free range only)
5. Band external rotations (rotator cuff specific — key injury-management exercise)

**Finisher (5 min):** face pulls with band + prone Y-T-W raises (light or no weight) — rotator cuff & posterior shoulder health

### Day 3 — Thursday: Boxing Conditioning
**Warm-up (5 min):** shadowboxing, jumping jacks, high knees, arm circles

**Main circuit (20 min) — 4 rounds, 45s work / 15s rest:**
1. Shadowboxing combos (no shoulder-loaded punches overhead — straight/hook/uppercut at moderate pace)
2. Squat jumps (or squats if joints need it low-impact)
3. Mountain climbers
4. Dumbbell swings (light, hip-hinge focus — not kettlebell-style overhead)
5. Burpees (no push-up version if shoulder flares, modify to step-back burpee)

**Finisher (5 min):** jump rope or high knees intervals, 30s on/30s off

### Day 4 — Weekend: Full-Body Strength + Mobility
**Warm-up (5 min):** full-body dynamic stretch + shoulder CARs (controlled articular rotations)

**Main circuit (20 min) — 4 rounds, 40s work / 20s rest:**
1. Dumbbell deadlifts
2. Dumbbell rows (single arm, bench-supported)
3. Goblet squats
4. Glute bridges (dumbbell on hips)
5. Band external rotation + band pull-apart superset (shoulder maintenance)

**Finisher (5 min):** full-body mobility flow — thoracic rotations, hip openers, shoulder dislocates with band (pain-free range only)

### Progression rule (so this isn't static)
Every 2 weeks: increase either reps, rounds (4→5), or weight — never more than one variable at a time. If any shoulder exercise causes pain, drop weight or swap to the band-only version, don't push through.

---

## 3. App Technical Spec

### What it is
A single-page web app (works as a Claude "artifact" or standalone HTML file) — for one user, no login, no backend needed. All data (progress log) stored in local browser memory for the session, or optionally exported as text/JSON.

### Core screens
1. **Home / Day selector** — shows Tue/Wed/Thu/Weekend, picks today's workout automatically based on day of week (with manual override)
2. **Workout player** — the main screen:
   - Shows current exercise name + simple illustration
   - Work/rest countdown timer (auto-advances through the circuit)
   - Audio cue (beep) at transitions — "3-2-1 switch" style tone, not real music (licensing) — user plays their own music in background
   - Round counter (e.g. "Round 2 of 4")
   - Pause/skip controls
3. **Progress log** — simple list: date, workout completed, optional notes/weight used per exercise
4. **Settings** — adjust work/rest seconds, number of rounds, sound on/off

### Data model (simple, in-memory JS objects)
```
Exercise { name, illustrationId, defaultWork, defaultRest }
WorkoutDay { name, warmup[], circuit[], finisher[] }
ProgressEntry { date, dayName, notes }
```

### Illustrations
Simple custom line-art SVGs per exercise (not stock photos) — flat, minimal, consistent style. ~20 unique exercises total across the program, so ~20 illustrations needed.

### Audio
Use the Web Audio API to generate simple tones (no copyrighted audio needed) for: work start, 3-second warning, rest start, workout complete.

### Tech stack recommendation
- Plain HTML/CSS/JS (single file) or React if built as a Claude artifact — no backend, no database needed since it's single-user and session-based
- If persistence across browser sessions is wanted later: use the artifact's key-value storage API (if built in Claude) or localStorage (if built as a standalone file outside Claude.ai)

---

## 4. Suggested task breakdown (for delegating to AI builders)

If splitting across multiple AI sessions/models to save tokens, this is a clean way to divide it:

1. **Task A — Timer engine:** Build the work/rest interval timer logic + audio cues + round tracking. Standalone, testable without UI polish.
2. **Task B — Exercise illustrations:** Generate ~20 simple SVG line-art illustrations, one per exercise listed above.
3. **Task C — Workout data + UI:** Wire up the day selector, workout player screen, and the program data from Section 2 above.
4. **Task D — Progress log + settings:** Add the logging screen and adjustable settings.
5. **Task E — Integration pass:** Combine A–D into one final app, test end to end.

Each task can be hand it to a fresh AI session with just the relevant section of this doc — no need to re-explain the whole project each time.

---

## 5. Open decisions (confirm before/while building)
- [ ] Any specific songs/playlist workflow desired, or is "user plays their own music in background" sufficient? (Confirmed: yes, background music + app timer, no in-app streaming)
- [ ] Do you want the progress log to persist across sessions (needs storage), or is session-only fine to start?
- [ ] Confirm rotator cuff side (left/right) if any exercise needs to be one-sided or avoided entirely
