/**
 * js/timer.js
 * ============================================================================
 * Self-contained work/rest interval timer engine for the calisthenics PWA.
 *
 * OWNERSHIP: This file is owned exclusively by this build task. It does not
 * read or write any other file, does not know about the app's DOM, and does
 * not know about the real workout data structure. It only depends on being
 * handed an array of generic step objects:
 *
 *   { name: string, workSeconds: number, restSeconds: number }
 *
 * It exposes a single global object: `Timer` (attached to `window`).
 * No build step / bundler / ES modules are assumed — include this file with
 * a plain <script src="js/timer.js"></script> tag BEFORE app.js in index.html.
 *
 * ----------------------------------------------------------------------------
 * PUBLIC API (this is the contract app.js should code against)
 * ----------------------------------------------------------------------------
 *
 * Timer.load(steps, options)
 *   Loads a sequence of exercises for ONE round and how many rounds to repeat
 *   it. Must be called before start(). Resets any previous run.
 *     steps   : Array<{ name, workSeconds, restSeconds }>  (required)
 *     options : {
 *       rounds        : number  (default 1)  — how many times to repeat `steps`
 *       dropFinalRest : boolean (default true) — if true, the very last rest
 *                       period of the very last round is skipped (no point
 *                       resting right before "workout complete").
 *       soundEnabled  : boolean (default true)
 *     }
 *
 * Timer.start()
 *   Begins (or restarts from the beginning of) the loaded sequence.
 *   IMPORTANT (iOS Safari): call this directly from inside a user gesture
 *   handler (a click/tap listener), see the iOS AUDIO NOTES block below —
 *   this is what unlocks Web Audio on iPhone.
 *
 * Timer.pause()      — freezes the countdown where it stands.
 * Timer.resume()      — continues from where it was paused.
 * Timer.togglePause() — convenience: pause if running, resume if paused.
 * Timer.skip()        — immediately ends the current phase and advances to
 *                        the next one (work->rest, rest->next work, or
 *                        finishes the workout if nothing is left).
 * Timer.stop()         — halts the timer entirely and resets to idle.
 *                         Does NOT fire onComplete.
 * Timer.reset()        — alias of stop(), kept for readability at call sites.
 *
 * Timer.setSoundEnabled(bool)
 * Timer.isSoundEnabled() -> boolean
 *
 * Timer.getState() -> {
 *   phase:            'idle' | 'work' | 'rest' | 'paused' | 'complete',
 *   phaseBeforePause: 'work' | 'rest' | null,   // what pause() interrupted
 *   remainingSeconds: number,
 *   totalPhaseSeconds:number,
 *   exerciseName:     string | null,
 *   round:            number,   // 1-based
 *   totalRounds:      number,
 *   stepIndex:        number,   // 0-based index within a single round
 *   totalSteps:       number,   // steps per round
 *   segmentIndex:     number,   // 0-based index into the full flattened run
 *   totalSegments:    number,
 * }
 *
 * Timer.onTick(callback)
 *   Registers a callback fired roughly once per second while running.
 *   callback(state) receives the same shape as getState(). Multiple
 *   listeners can be registered; each call to onTick ADDS a listener.
 *
 * Timer.onPhaseChange(callback)
 *   Registers a callback fired the INSTANT the phase changes (work started,
 *   rest started, moved to next exercise, etc.) — use this to swap the
 *   exercise name / illustration immediately, rather than waiting up to a
 *   second for the next tick. callback(state) — same shape as getState().
 *
 * Timer.onComplete(callback)
 *   Registers a callback fired exactly once when the entire loaded sequence
 *   (all rounds, all steps) finishes naturally. callback() takes no args.
 *   NOT fired if stop()/reset() is called manually.
 *
 * All three `on*` registration functions return an "unsubscribe" function,
 * e.g.: const off = Timer.onTick(fn); /* later */ /* off(); *\/
 *
 * ----------------------------------------------------------------------------
 * iOS SAFARI AUDIO / TIMER NOTES (read before integrating in app.js)
 * ----------------------------------------------------------------------------
 * 1. iOS Safari will not let a page play any Web Audio sound until an
 *    AudioContext has been created/resumed from within a direct user
 *    gesture (a tap/click event handler), not from a setTimeout, promise
 *    callback, or automatic app logic. This file lazily creates its single
 *    AudioContext the first time Timer.start() runs — so make sure the
 *    button that calls Timer.start() is a real tap handler, not something
 *    fired programmatically on page load.
 * 2. Older iOS Safari only exposes `webkitAudioContext`; we fall back to it.
 * 3. We reuse ONE AudioContext for the whole timer's lifetime and spin up a
 *    new OscillatorNode per beep (oscillators are single-use/one-shot by
 *    spec — you cannot restart a stopped oscillator, so a fresh one is
 *    created for every tone). This avoids iOS's limit on concurrent
 *    AudioContexts.
 * 4. If Web Audio fails to initialize for any reason (older iOS quirk,
 *    permissions, etc.), all audio calls are wrapped in try/catch and fail
 *    silently — the countdown itself keeps working with no sound.
 * 5. Countdown accuracy: iOS Safari (like most mobile browsers) throttles
 *    or pauses setInterval timers when the tab is backgrounded, the screen
 *    locks, or the phone sleeps. To avoid the timer drifting or freezing,
 *    this file does NOT count down by decrementing a counter on every
 *    interval tick. Instead, each phase records its real wall-clock end
 *    time (Date.now() + durationMs) once, and every interval tick simply
 *    RECOMPUTES remaining time as (endTime - Date.now()). That means even
 *    if iOS skips a bunch of ticks while the screen is locked, the moment
 *    the app becomes active again the timer immediately shows the correct
 *    remaining time (or correctly fast-forwards through phases that fully
 *    elapsed in the background) instead of being stuck or drifting late.
 *    One accepted limitation: if the phone was locked/backgrounded through
 *    an entire phase, the 3-2-1 warning beep and the phase-start tone for
 *    that phase may not have audibly played in real time — there is no way
 *    around this on iOS Safari without a native app / notification API.
 * ============================================================================
 */

const Timer = (function () {
  'use strict';

  // ---- internal state ------------------------------------------------
  let segments = [];        // flattened list of {phase, seconds, name, round, stepIndex}
  let totalRounds = 1;
  let stepsPerRound = 0;

  let segmentIndex = -1;    // index into `segments` of the current phase
  let phase = 'idle';       // 'idle' | 'work' | 'rest' | 'paused' | 'complete'
  let phaseBeforePause = null;

  let phaseEndTimestamp = 0;   // Date.now()-based target end time for current phase
  let remainingSeconds = 0;    // last computed remaining seconds (whole number)
  let totalPhaseSeconds = 0;   // duration of the current phase, for progress bars

  let lastEmittedSecond = null; // avoids emitting duplicate onTick calls
  let warningBeepsFiredFor = null; // tracks which segmentIndex already got 3-2-1 beeps this phase

  let intervalHandle = null;
  const TICK_INTERVAL_MS = 200; // check frequently; only emit on whole-second changes

  let soundEnabled = true;

  const tickListeners = [];
  const phaseChangeListeners = [];
  const completeListeners = [];

  // ---- audio ------------------------------------------------------------
  let audioCtx = null;

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; // iOS Safari fallback
      if (!Ctx) return null;
      audioCtx = new Ctx();
    } catch (err) {
      audioCtx = null;
    }
    return audioCtx;
  }

  function unlockAudioContext() {
    // iOS Safari sometimes creates the context in a 'suspended' state even
    // inside a user gesture; explicitly resuming it here (still within the
    // same gesture call stack from start()) is the reliable unlock pattern.
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {/* ignore — will just stay silent */});
    }
  }

  function playTone({ freq = 440, duration = 0.15, type = 'sine', gain = 0.2, delay = 0 } = {}) {
    if (!soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const startAt = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startAt);
      gainNode.gain.setValueAtTime(gain, startAt);
      // exponential ramp gives a natural "beep" decay instead of an abrupt cut
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
    } catch (err) {
      // fail silently — never let an audio glitch break the countdown
    }
  }

  function playWarningBeep(secondsLeft) {
    // Distinct rising pitch for 3, 2, 1 so the user can tell how close the
    // transition is without looking at the screen.
    const freqBySecond = { 3: 660, 2: 784, 1: 988 };
    playTone({ freq: freqBySecond[secondsLeft] || 700, duration: 0.1, type: 'square', gain: 0.15 });
  }

  function playWorkStartTone() {
    // Two quick ascending beeps — energetic "go" cue.
    playTone({ freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.22 });
    playTone({ freq: 659.25, duration: 0.16, type: 'triangle', gain: 0.22, delay: 0.13 });
  }

  function playRestStartTone() {
    // Single lower, longer tone — calm "rest" cue, clearly distinct from work.
    playTone({ freq: 349.23, duration: 0.3, type: 'sine', gain: 0.2 });
  }

  function playCompleteTone() {
    // Short ascending three-note chime for "workout finished".
    playTone({ freq: 523.25, duration: 0.18, type: 'triangle', gain: 0.22, delay: 0 });
    playTone({ freq: 659.25, duration: 0.18, type: 'triangle', gain: 0.22, delay: 0.18 });
    playTone({ freq: 783.99, duration: 0.35, type: 'triangle', gain: 0.24, delay: 0.36 });
  }

  // ---- sequence building --------------------------------------------------
  function buildSegments(steps, rounds, dropFinalRest) {
    const built = [];
    for (let round = 1; round <= rounds; round++) {
      steps.forEach((step, stepIndex) => {
        built.push({
          phase: 'work',
          seconds: Math.max(0, Math.round(step.workSeconds || 0)),
          name: step.name,
          round,
          stepIndex,
        });
        const restSeconds = Math.max(0, Math.round(step.restSeconds || 0));
        if (restSeconds > 0) {
          built.push({
            phase: 'rest',
            seconds: restSeconds,
            name: step.name,
            round,
            stepIndex,
          });
        }
      });
    }
    if (dropFinalRest && built.length > 0 && built[built.length - 1].phase === 'rest') {
      built.pop();
    }
    return built;
  }

  // ---- state snapshot -------------------------------------------------
  function getState() {
    const seg = segments[segmentIndex] || null;
    return {
      phase,
      phaseBeforePause,
      remainingSeconds,
      totalPhaseSeconds,
      exerciseName: seg ? seg.name : null,
      round: seg ? seg.round : 0,
      totalRounds,
      stepIndex: seg ? seg.stepIndex : 0,
      totalSteps: stepsPerRound,
      segmentIndex,
      totalSegments: segments.length,
    };
  }

  // ---- listener helpers -------------------------------------------------
  function addListener(list, cb) {
    if (typeof cb !== 'function') return () => {};
    list.push(cb);
    return () => {
      const idx = list.indexOf(cb);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  function emitTick() {
    const state = getState();
    tickListeners.forEach((cb) => {
      try { cb(state); } catch (err) { /* one bad listener shouldn't kill the timer */ }
    });
  }

  function emitPhaseChange() {
    const state = getState();
    phaseChangeListeners.forEach((cb) => {
      try { cb(state); } catch (err) { /* ignore */ }
    });
  }

  function emitComplete() {
    completeListeners.forEach((cb) => {
      try { cb(); } catch (err) { /* ignore */ }
    });
  }

  // ---- core engine -------------------------------------------------
  function clearIntervalHandle() {
    if (intervalHandle !== null) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  function enterSegment(index) {
    if (index >= segments.length) {
      finishWorkout();
      return;
    }
    segmentIndex = index;
    const seg = segments[index];
    phase = seg.phase; // 'work' or 'rest'
    totalPhaseSeconds = seg.seconds;
    remainingSeconds = seg.seconds;
    phaseEndTimestamp = Date.now() + seg.seconds * 1000;
    lastEmittedSecond = null;
    warningBeepsFiredFor = null;

    if (seg.phase === 'work') {
      playWorkStartTone();
    } else if (seg.phase === 'rest') {
      playRestStartTone();
    }

    emitPhaseChange();
    emitTick(); // immediate tick so UI doesn't wait a full second to update
  }

  function finishWorkout() {
    clearIntervalHandle();
    phase = 'complete';
    remainingSeconds = 0;
    playCompleteTone();
    emitPhaseChange();
    emitComplete();
  }

  function tick() {
    if (phase !== 'work' && phase !== 'rest') return;

    const msRemaining = phaseEndTimestamp - Date.now();
    const secondsLeft = Math.max(0, Math.ceil(msRemaining / 1000));

    if (secondsLeft !== lastEmittedSecond) {
      remainingSeconds = secondsLeft;
      lastEmittedSecond = secondsLeft;

      // 3-2-1 warning beeps before a transition (only once per second, only
      // once per segment so a background/foreground jump can't replay them).
      if (secondsLeft <= 3 && secondsLeft >= 1 && warningBeepsFiredFor !== secondsLeft) {
        playWarningBeep(secondsLeft);
        warningBeepsFiredFor = secondsLeft;
      }

      emitTick();
    }

    if (msRemaining <= 0) {
      enterSegment(segmentIndex + 1);
    }
  }

  function startInterval() {
    clearIntervalHandle();
    intervalHandle = setInterval(tick, TICK_INTERVAL_MS);
  }

  // ---- public API -------------------------------------------------
  function load(steps, options = {}) {
    clearIntervalHandle();
    const rounds = Math.max(1, Math.round(options.rounds || 1));
    const dropFinalRest = options.dropFinalRest !== false; // default true
    if (typeof options.soundEnabled === 'boolean') {
      soundEnabled = options.soundEnabled;
    }

    stepsPerRound = Array.isArray(steps) ? steps.length : 0;
    totalRounds = rounds;
    segments = buildSegments(Array.isArray(steps) ? steps : [], rounds, dropFinalRest);

    segmentIndex = -1;
    phase = 'idle';
    phaseBeforePause = null;
    remainingSeconds = 0;
    totalPhaseSeconds = 0;
    lastEmittedSecond = null;
    warningBeepsFiredFor = null;
  }

  function start() {
    // Call this directly inside a tap/click handler — see iOS AUDIO NOTES.
    unlockAudioContext();
    if (segments.length === 0) return;
    clearIntervalHandle();
    enterSegment(0);
    startInterval();
  }

  function pause() {
    if (phase !== 'work' && phase !== 'rest') return;
    clearIntervalHandle();
    // freeze remainingSeconds as-is; recompute a fresh end timestamp on resume
    phaseBeforePause = phase;
    phase = 'paused';
    emitPhaseChange();
    emitTick();
  }

  function resume() {
    if (phase !== 'paused' || !phaseBeforePause) return;
    phase = phaseBeforePause;
    phaseBeforePause = null;
    phaseEndTimestamp = Date.now() + remainingSeconds * 1000;
    lastEmittedSecond = null; // allow immediate re-emit if same second
    emitPhaseChange();
    startInterval();
  }

  function togglePause() {
    if (phase === 'paused') {
      resume();
    } else if (phase === 'work' || phase === 'rest') {
      pause();
    }
  }

  function skip() {
    if (phase === 'idle' || phase === 'complete') return;
    clearIntervalHandle();
    const wasPaused = phase === 'paused';
    phase = wasPaused ? phaseBeforePause : phase;
    phaseBeforePause = null;
    enterSegment(segmentIndex + 1);
    if (phase === 'work' || phase === 'rest') {
      startInterval();
    }
  }

  function stop() {
    clearIntervalHandle();
    segmentIndex = -1;
    phase = 'idle';
    phaseBeforePause = null;
    remainingSeconds = 0;
    totalPhaseSeconds = 0;
    lastEmittedSecond = null;
    warningBeepsFiredFor = null;
    emitPhaseChange();
  }

  function setSoundEnabled(value) {
    soundEnabled = !!value;
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  return {
    load,
    start,
    pause,
    resume,
    togglePause,
    skip,
    stop,
    reset: stop, // alias
    setSoundEnabled,
    isSoundEnabled,
    getState,
    onTick: (cb) => addListener(tickListeners, cb),
    onPhaseChange: (cb) => addListener(phaseChangeListeners, cb),
    onComplete: (cb) => addListener(completeListeners, cb),
  };
})();

// Expose globally for plain <script> usage (no bundler/module system assumed).
window.Timer = Timer;