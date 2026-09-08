/**
 * js/workouts.js
 * -----------------------------------------------------------------------
 * Data-only module. Encodes the 4-day training program exactly as specified
 * in ai-handoff/calisthenics-app-project-plan.md — no exercises added,
 * removed, or substituted beyond what that document already specifies.
 *
 * ⚠️ SHOULDER CONSTRAINT (do not remove this note):
 * This person has a 2-year-old, still-symptomatic rotator cuff injury.
 * The program already avoids overhead pressing, dips, and behind-neck
 * movements. Do not add exercises here — this file only structures the
 * program that was already designed with that constraint in mind.
 *
 * ASSUMPTIONS (since the plan gives section totals, not always
 * per-exercise seconds):
 *   1. Where the plan gives an explicit "rounds / work / rest" for a
 *      section (all main circuits, Tuesday's finisher, Thursday's
 *      finisher), that exact timing is used.
 *   2. Where the plan only gives a total section time (all warm-ups,
 *      Wednesday's finisher, Weekend's finisher), the total is split
 *      evenly across that section's listed exercises so every exercise
 *      still has a workSeconds/restSeconds value for the timer engine
 *      to consume uniformly. This is a scheduling convenience only —
 *      it does not add, remove, or change any exercise.
 *   3. Thursday's finisher ("jump rope or high knees") is encoded as a
 *      single either/or entry, matching the plan's "or" phrasing.
 *
 * Consuming code (owned by other files) can loop:
 *   day -> section (warmup | circuit | finisher) -> exercises[] -> { name, workSeconds, restSeconds }
 * -----------------------------------------------------------------------
 */

(function (root) {
  'use strict';

  var DISCLAIMER =
    'Not medical advice — if any movement causes shoulder pain, stop and modify.';

  // ---- small helper: build an even-split section when only a total ----
  // duration is known (see Assumption #2 above). Not used for sections
  // that already have explicit per-round timing from the plan.
  function evenSplitSection(exerciseDefs, totalSeconds, restSeconds) {
    var per = Math.round(totalSeconds / exerciseDefs.length);
    return {
      rounds: 1,
      totalSeconds: totalSeconds,
      timingSource: 'even-split-of-stated-total', // see Assumption #2
      exercises: exerciseDefs.map(function (ex) {
        return {
          name: ex.name,
          note: ex.note || null,
          workSeconds: per,
          restSeconds: typeof restSeconds === 'number' ? restSeconds : 0
        };
      })
    };
  }

  // ---- helper: build a section with explicit rounds/work/rest ----
  function timedSection(exerciseDefs, rounds, workSeconds, restSeconds) {
    return {
      rounds: rounds,
      timingSource: 'explicit-from-plan',
      exercises: exerciseDefs.map(function (ex) {
        return {
          name: ex.name,
          note: ex.note || null,
          workSeconds: workSeconds,
          restSeconds: restSeconds
        };
      })
    };
  }

  var WORKOUTS = {
    disclaimer: DISCLAIMER,

    // Order used for day-selector UI / iteration.
    dayOrder: ['tuesday', 'wednesday', 'thursday', 'weekend'],

    days: {

      // ---------------------------------------------------------------
      // TUESDAY — Legs & Core (Soccer)
      // ---------------------------------------------------------------
      tuesday: {
        key: 'tuesday',
        name: 'Legs & Core (Soccer)',
        focus: 'Single-leg strength, explosive-controlled power, core',

        warmup: evenSplitSection(
          [
            { name: 'Leg swings' },
            { name: 'Bodyweight squats' },
            { name: 'Walking lunges' },
            { name: 'Hip circles' },
            { name: 'Ankle rolls' }
          ],
          5 * 60, // 5 min total, per plan
          0
        ),

        circuit: timedSection(
          [
            { name: 'Dumbbell goblet squats' },
            { name: 'Walking lunges (holding dumbbells)' },
            { name: 'Single-leg Romanian deadlift (dumbbell)' },
            { name: 'Lateral band walks' },
            { name: 'Bulgarian split squats (rear foot on bench)' }
          ],
          4,   // rounds
          40,  // work seconds
          20   // rest seconds
        ),

        finisher: timedSection(
          [
            { name: 'Plank variations' },
            { name: 'Bicycle crunches' },
            { name: 'Dead bugs' }
          ],
          2,   // rounds
          40,  // work seconds
          20   // rest seconds
        )
      },

      // ---------------------------------------------------------------
      // WEDNESDAY — Upper Body (Shoulder-Safe)
      // ---------------------------------------------------------------
      wednesday: {
        key: 'wednesday',
        name: 'Upper Body (Shoulder-Safe)',
        focus: 'Rows, curls, triceps, rotator cuff prehab — no overhead pressing',

        warmup: evenSplitSection(
          [
            { name: 'Band pull-aparts' },
            { name: 'Arm circles (small to large)' },
            { name: 'Scapular wall slides' },
            { name: 'Cat-cow' }
          ],
          5 * 60,
          0
        ),

        circuit: timedSection(
          [
            { name: 'Dumbbell bent-over rows' },
            {
              name: 'Incline dumbbell chest press',
              note: 'Bench inclined — easier on the front of the shoulder than flat/overhead pressing.'
            },
            { name: 'Dumbbell bicep curls' },
            {
              name: 'Standing overhead triceps extension',
              note: 'Light weight, pain-free range of motion only.'
            },
            {
              name: 'Band external rotations',
              note: 'Rotator cuff specific — key injury-management exercise.'
            }
          ],
          4,
          40,
          20
        ),

        // Plan gives a 5-min total for this finisher but no explicit
        // rounds/work/rest — see Assumption #2.
        finisher: evenSplitSection(
          [
            { name: 'Face pulls (band)' },
            {
              name: 'Prone Y-T-W raises',
              note: 'Light weight or bodyweight — rotator cuff & posterior shoulder health.'
            }
          ],
          5 * 60,
          0
        )
      },

      // ---------------------------------------------------------------
      // THURSDAY — Boxing Conditioning
      // ---------------------------------------------------------------
      thursday: {
        key: 'thursday',
        name: 'Boxing Conditioning',
        focus: 'Full-body interval circuit, fat-loss focused',

        warmup: evenSplitSection(
          [
            { name: 'Shadowboxing' },
            { name: 'Jumping jacks' },
            { name: 'High knees' },
            { name: 'Arm circles' }
          ],
          5 * 60,
          0
        ),

        circuit: timedSection(
          [
            {
              name: 'Shadowboxing combos',
              note: 'Straight/hook/uppercut at moderate pace — no shoulder-loaded overhead punches.'
            },
            {
              name: 'Squat jumps',
              note: 'Substitute regular squats if joints need low-impact.'
            },
            { name: 'Mountain climbers' },
            {
              name: 'Dumbbell swings',
              note: 'Light weight, hip-hinge focus — not kettlebell-style overhead swings.'
            },
            {
              name: 'Burpees',
              note: 'Modify to step-back burpee (no push-up) if shoulder flares.'
            }
          ],
          4,
          45, // work seconds (Thursday uses 45/15, not 40/20)
          15  // rest seconds
        ),

        // Explicit 30/30 given in the plan; "jump rope or high knees" is
        // an either/or choice per the plan's wording — see Assumption #3.
        finisher: timedSection(
          [
            {
              name: 'Jump rope (or high knees) intervals',
              note: "Either jump rope or high knees, per the plan's 'or' phrasing."
            }
          ],
          5,  // 5 x 30/30 = 5 minutes total
          30,
          30
        )
      },

      // ---------------------------------------------------------------
      // WEEKEND — Full-Body Strength + Mobility
      // ---------------------------------------------------------------
      weekend: {
        key: 'weekend',
        name: 'Full-Body Strength + Mobility',
        focus: 'Compound strength + rotator cuff/shoulder mobility maintenance',

        warmup: evenSplitSection(
          [
            { name: 'Full-body dynamic stretch' },
            {
              name: 'Shoulder CARs',
              note: 'Controlled Articular Rotations — pain-free range only.'
            }
          ],
          5 * 60,
          0
        ),

        circuit: timedSection(
          [
            { name: 'Dumbbell deadlifts' },
            {
              name: 'Dumbbell rows (single arm, bench-supported)'
            },
            { name: 'Goblet squats' },
            { name: 'Glute bridges (dumbbell on hips)' },
            {
              name: 'Band external rotation + band pull-apart superset',
              note: 'Shoulder maintenance superset.'
            }
          ],
          4,
          40,
          20
        ),

        // Plan gives a 5-min total mobility flow, no explicit per-move
        // timing — see Assumption #2.
        finisher: evenSplitSection(
          [
            { name: 'Thoracic rotations' },
            { name: 'Hip openers' },
            {
              name: 'Shoulder dislocates with band',
              note: 'Pain-free range only.'
            }
          ],
          5 * 60,
          0
        )
      }
    }
  };

  // ---------------------------------------------------------------------
  // Small lookup helper — maps a JS Date's day-of-week to a program key.
  // Saturday and Sunday both resolve to "weekend" per the plan (one
  // weekend session/week). Included here (not in app.js) because it's
  // pure workout-data logic with no UI/timer dependencies.
  // ---------------------------------------------------------------------
  function getWorkoutKeyForDate(date) {
    var d = date instanceof Date ? date : new Date();
    var dow = d.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
    switch (dow) {
      case 2: return 'tuesday';
      case 3: return 'wednesday';
      case 4: return 'thursday';
      case 0:
      case 6: return 'weekend';
      default: return null; // Mon/Fri: no scheduled session, per plan
    }
  }

  WORKOUTS.getWorkoutKeyForDate = getWorkoutKeyForDate;
  WORKOUTS.getWorkoutForDate = function (date) {
    var key = getWorkoutKeyForDate(date);
    return key ? WORKOUTS.days[key] : null;
  };

  // ---- export (classic <script> global + optional CommonJS) ----
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WORKOUTS;
  }
  root.WORKOUTS = WORKOUTS;

})(typeof window !== 'undefined' ? window : this);