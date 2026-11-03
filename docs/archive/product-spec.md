> Historical planning document. The standalone prototype and design preview have been retired.
> See the [current README](../../README.md) and [architecture](../architecture.md) for the maintained app.

# Pitch Perfect Studio — current product specification

**Revision:** 1.0, source-audit baseline, 2026-11-03.\
**Status:** Documented implementation; product acceptance and device support remain unverified.\
**Next artifact:** [UI/UX improvement plan, proposed tickets, and UAT](ux-improvement-plan.md).

This specification describes the working copy in this repository. It separates
existing behavior from defects, ambiguous contracts, and proposed improvements.
It is not a claim that every current behavior is desirable, that user research
has been conducted, or that mobile and desktop support has been certified.

## 1. Product purpose and evidence

Pitch Perfect Studio is a browser-based ear-training and vocal-practice studio.
It combines note identification, interval recognition, chord quality/inversion
recognition, harmony practice, a microphone tuner with drills, and a shared piano.
The central loop is **hear → identify or sing → receive feedback → practice again**.

Working audience hypotheses are self-directed music learners, singers, and
instrumentalists. Beginner and experienced users have different vocabulary,
range, and setup needs; these segments have not been validated through research.
No market-size, competitor, retention, or learning-effectiveness claim is made.

### Evidence and verification

- Inspected `index.html`, all application JavaScript and CSS, both test files,
  project instructions, and README. Source references below refer to this snapshot.
- Executed checks: `npm run check` and `npm test`; syntax checks and all
  13 Node tests passed. The tests use pure functions, a minimal DOM, and synthetic
  audio buffers; they do not execute complete browser rendering or hardware UAT.
- Browser inventory reported no available browsers and “browser access host is
  unavailable.” Desktop/mobile layouts, real microphone input, audio output,
  permissions, and assistive technology have **not** been exercised in this audit.
- Source-supported findings are labeled **observed**. Layout consequences and
  real-device effects requiring reproduction are labeled **risks**. Proposed
  requirements are exclusively in the improvement plan.
- Additional isolated Node executions of actual source functions confirmed two
  target-generation counterexamples and one identical-voicing grading ambiguity
  documented below. Rendering/playback were stubbed; these are code-executed
  findings, not audible or browser validation.

### Source map

| Area | Primary evidence |
| --- | --- |
| Shell and global controls | `index.html:11` (retired prototype), `app.js:455` (retired prototype) |
| Music vocabulary and state defaults | `app.js:7` (retired prototype), `app.js:70` (retired prototype) |
| Stats persistence | `app.js:139` (retired prototype) |
| Audio synthesis and drone | `app.js:179` (retired prototype), `app.js:345` (retired prototype) |
| Piano | `app.js:386` (retired prototype), `index.html:623` (retired prototype) |
| Note training | `app.js:549` (retired prototype), `index.html:154` (retired prototype) |
| Interval training | `app.js:726` (retired prototype), `index.html:223` (retired prototype) |
| Chord training | `app.js:910` (retired prototype), `index.html:292` (retired prototype) |
| Harmony and SATB | `app.js:1097` (retired prototype), `index.html:379` (retired prototype) |
| Microphone/drills | `app.js:1276` (retired prototype), `index.html:523` (retired prototype) |
| Pitch detector, capture, and update loop | `app.js:1344` (retired prototype), `app.js:1395` (retired prototype), `app.js:1453` (retired prototype) |
| Hold/answer rules | `practice.js:1` (retired prototype) |
| Layout and responsive rules | `styles.css:183` (retired prototype), `styles.css:238` (retired prototype), `styles.css:703` (retired prototype) |
| Existing regression evidence | `app-regressions.test.js` (retired prototype), `practice.test.js` (retired prototype) |

## 2. Scope and application structure

| Baseline ID | Existing capability | Preservation criterion for subsequent design work |
| --- | --- | --- |
| B-SHELL-01 | One page, shared header/settings, five mode buttons, one active panel, shared footer piano. Notes is initially active. | All five modes remain discoverable and reachable on supported layouts; navigation does not lose a user's setup without explanation. |
| B-CONFIG-01 | Shared instrument, range, root, scale, notation, and tuning controls. | Every setting remains available; affected exercises communicate their active configuration. |
| B-NOTE-01 | Random note playback, pitch-class or exact-octave guessing, references, retries, mastery. | Preserve the training loop and true exact-octave grading. |
| B-INT-01 | Twelve intervals, melodic/harmonic directions, presets, filters, examples, guessing. | Preserve supported interval vocabulary and playback methods. |
| B-CHORD-01 | Eleven chord qualities, quality/inversion modes, presets, isolated voices. | Preserve chord vocabulary and explain supported inversion behavior. |
| B-HARM-01 | Eight target-harmony challenges, backing drone, cue, preview, live lock. | Preserve backing/target distinction and genuine live-input acceptance. |
| B-SATB-01 | Four progression choices with four voice lanes, mute and audition actions. | Preserve minus-one practice and honest progression labeling. |
| B-MIC-01 | Shared microphone capture, free tuner, three drill types, visual history, preview. | Preserve optional microphone access, stoppability, tuner, and drill completion rules. |
| B-PIANO-01 | C2–C6 keyboard with audition, note-answer submission, scale/range/detection indicators. | Preserve range access and keyboard/touch alternatives to exact-octave answers. |
| B-STATS-01 | Persistent aggregate XP, answer streak, accuracy, per-note-class counters; reset. | Preserve existing data and storage key while making definitions and reset consequences clear. |

These preservation criteria express the product contract for a redesign. The
implementation observations below and gap register identify where it is incomplete.
The current app has no accounts, backend, cloud sync, recordings, MIDI input,
subscriptions, social features, formal lessons, bounded practice sessions,
notifications, content catalog, or exported reports. Adding them is outside this
UI/UX audit's immediate scope.

### Current information architecture and entry flow

1. Page loads all markup, initializes controls, generates answers/filter chips,
   builds the keyboard, generates a mic queue, restores stats, and starts an
   animation-frame loop. It does not play a note or request microphone access.
2. The header exposes all shared settings and aggregate stats immediately.
3. A horizontal mode strip changes the active CSS panel. The other panels remain
   in the DOM, hidden with `display:none`. There is no URL state or history route.
4. Each panel contains a main training card and a secondary help/settings card.
   At widths above 1024px these form `1fr 350px` columns; at 1024px and below they
   stack. The footer piano follows the content; it is not a fixed dock.
5. The user starts playback, answers/retries, or explicitly enables capture.
   There is no onboarding, goal selection, session boundary, or end-of-session review.

**Inventory reconciliation:** The markup contains 65 static native controls:
14 in the shared shell (including five navigation buttons), seven in Notes,
nine in Intervals, twelve in Chords, sixteen in Harmony, six in Mic, and one
piano-submission checkbox. Generated interactions are additional: twelve note
answers; twelve interval chips, active interval answers, and twelve anchor Hear
buttons; eleven chord chips, active quality answers, and three/four voice
isolators; variable-length drill chips; and 49 piano key controls. The sections
below cover these generated actions as well as the static inventory.

## 3. Shared configuration and music vocabulary

### Controls and defaults

| Control | Initial value | Options / observed rule |
| --- | --- | --- |
| Instrument (`cfg-timbre`) | Grand Piano | Piano, Rhodes-style electric piano, choir/strings-style pad, organ, sine. These are synthesized timbres, not sampled recordings. |
| Range preset (`cfg-vocal-preset`) | Standard 2-Octave | Single C4–B4; standard C3–C5; soprano C4–C6; mezzo A3–A5; alto F3–F5; tenor C3–C5; baritone A2–A4; bass E2–E4; full C2–C6. |
| Low / High | C3 / C5, MIDI 48 / 72 | Each selector contains every semitone C2–C6 inclusive, MIDI 36–84. Manual changes enforce at least four semitones between endpoints. |
| Root key | C | Twelve pitch classes; accidentals show sharp/flat alternatives. |
| Scale | Major | Ten scale definitions listed below. |
| Labels | Letter | Letter, movable-root solfège, relative chromatic scale degrees. Effect is not universal; some surfaces remain fixed letter labels. |
| A4 | 440Hz | Numeric input, nominal 430–448Hz, step 1. Internal value is clamped to 430–448; invalid/empty/zero parses to 440. The field is not rewritten after clamping. |
| Reset Stats | Action | Immediately clears XP, streak, aggregate attempts/correct counts, and twelve note-stat cells, then saves. No confirmation or undo. |

Manual range edits do not change the displayed preset to “Custom.” Instrument
changes affect future one-shot notes only. All other configuration changes call
`refreshAllModules()`, rebuilding the keyboard, answer sets, harmony setup, mic
queue, and stats display. They do not clear existing note/interval/chord targets.

### Scale definitions

Offsets are semitones from the selected root, wrapped by pitch class. The active
note pool includes every matching pitch within the inclusive range. If empty,
the implementation falls back to C4 even if C4 violates the chosen settings.

| Scale | Offsets |
| --- | --- |
| Chromatic | 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 |
| Major / Ionian | 0, 2, 4, 5, 7, 9, 11 |
| Natural minor / Aeolian | 0, 2, 3, 5, 7, 8, 10 |
| Harmonic minor | 0, 2, 3, 5, 7, 8, 11 |
| Melodic minor | 0, 2, 3, 5, 7, 9, 11; no separate descending form |
| Dorian | 0, 2, 3, 5, 7, 9, 10 |
| Mixolydian | 0, 2, 4, 5, 7, 9, 10 |
| Major pentatonic | 0, 2, 4, 7, 9 |
| Minor pentatonic | 0, 3, 5, 7, 10 |
| Blues | 0, 3, 5, 6, 7, 10 |

Frequency conversion is `A4 × 2^((MIDI−69)/12)`; detected frequency converts back
using the inverse logarithm. MIDI 60 is C4. Letter names use a combined
enharmonic display, while piano labels and some quiz results use sharp names.
Solfège and degree labels are relative to the selected root; degrees are
chromatic offsets, not a recalculated seven-degree scale spelling.

## 4. Note Identification

**Controls:** Play Mystery Note; replay via the clickable orb; Play Key Tonic;
Play I–IV–V–I Cadence; Next Question; Require Exact Octave (off); Auto-Advance
(on); twelve answer buttons; Play Active Scale; shared piano submission (on).

**Observed loop:**

1. Start/Next selects uniformly from the active MIDI pool and plays for 1.25s.
   The orb becomes “?” and briefly animates; feedback invites a guess.
2. Play replays the current unresolved note, or creates another question after
   success. The orb replays an existing target even after success.
3. Pitch-class buttons always display letter names with relative solfège/degree
   subtitles. Out-of-scale options are visually faded and pointer-blocked using
   CSS, not native `disabled` state.
4. In ordinary mode, any octave of the correct pitch class is accepted. In exact
   mode, a class-only answer explains that a piano answer is needed and changes
   no counters. The piano submission toggle must also be enabled.
5. A wrong guess increments aggregate and target-class attempts, resets streak,
   marks the guessed answer, and permits another attempt. A piano guess adds a
   too-high/too-low hint. A correct guess reveals note, octave, and frequency,
   increments correct counters and XP, and prevents repeat grading of that round.
6. Auto-Advance schedules another question after 1.2s. Next skips without scoring.
   The timer is not cancelled on skip, mode switch, or configuration change.

**References:** Tonic is `C4 + root offset`, regardless of range. Cadence plays
I–IV–V–I starting there, with minor thirds only when the scale ID contains
`minor`; V uses a major third. Active Scale plays all configured offsets plus
the octave, starting at the same root, regardless of range.

**Mastery:** Twelve fixed letter-class cells show `correct/attempts` and rounded
percentage. Border colors use ≥80%, ≥50%, and <50% bands. Untested classes show
0/0. These values persist across reloads despite “in this session” copy.

| Baseline criterion | Observable expected preservation |
| --- | --- |
| B-NOTE-01.A | A new valid target comes from the active pool; replay does not change an unresolved target. |
| B-NOTE-01.B | Exact-octave mode rejects a matching pitch in another octave and does not grade a class-only answer. |
| B-NOTE-01.C | Each accepted grading action updates the documented counters; answered rounds cannot be graded twice. |
| B-NOTE-01.D | References, skip, auto/manual continuation, and per-class feedback remain available without becoming hidden traps on narrow layouts. |

## 5. Interval Trainer

**Defaults:** All 1–12 semitone intervals active; Melodic + Harmonic playback;
fixed tonic off. Unison exists in the data table but is excluded from the UI.

| ID / short name | Semitones | ID / short name | Semitones |
| --- | --- | --- | --- |
| Minor 2nd / m2 | 1 | Perfect 5th / P5 | 7 |
| Major 2nd / M2 | 2 | Minor 6th / m6 | 8 |
| Minor 3rd / m3 | 3 | Major 6th / M6 | 9 |
| Major 3rd / M3 | 4 | Minor 7th / m7 | 10 |
| Perfect 4th / P4 | 5 | Major 7th / M7 | 11 |
| Tritone / TT | 6 | Perfect octave / P8 | 12 |

**Controls:** Play Interval; Hear Melodic; Hear Harmonic; Next Interval;
direction selector (ascending, descending, simultaneous, melodic+harmonic,
random mixed); Fix Root to Key Tonic; twelve filter chips; three presets; twelve
song-anchor Hear actions. Each song anchor names ascending/descending examples;
Hear plays a generic two-note synthesized interval, not a recording of the song.

**Presets:** Beginner = {1,2,4,5,7,12}; Major Scale Diatonic =
{2,4,5,7,9,11,12}; All = {1…12}. Chips cannot reduce the active set below two.

The next question selects an active interval. Fixed root uses `60 + rootKey`;
otherwise the base is selected from the active pool with its last four entries
excluded when the pool is longer than four. This does not ensure the upper note
fits the range or scale. Descending sets the first note above the base; mixed
chooses ascending, descending, or simultaneous, not the combined mode.

Ascending/descending notes begin 0.65s apart. Harmonic notes play together.
Combined plays the pair 0.58s apart and repeats together at 1.25s. The displayed
first note is revealed before answering. “Hear Melodic” replays ascending even
for a descending question. If Hear Melodic/Harmonic is the very first action,
it initializes and plays according to the selected direction, rather than the
button's override.

Wrong answers count, reset streak, and hint smaller/wider. Correct answers
reveal interval and both notes, award XP, and close the round. No auto-advance.
Changing active filters re-renders answers without replacing the target.

**Code-executed boundary example:** With C4–C5 range, C major, octave-only
intervals, ascending mode, and a high random selection, actual source generation
returned F4→F5 (MIDI 65→77), exceeding the C5 high setting. Rendering and playback
were stubbed for this isolated execution.

| Baseline criterion | Observable expected preservation |
| --- | --- |
| B-INT-01.A | Only configured intervals generate new questions; all supported directions remain playable. |
| B-INT-01.B | Guessing compares semitone distance, allows retries, and closes a successful round once. |
| B-INT-01.C | Presets, filters, and educational anchors remain available with an understandable minimum selection rule. |

## 6. Chord & Inversion Lab

**Defaults:** Arpeggio + Block; Root Position Only; nine active qualities
(all except half-diminished seventh and diminished seventh). Selected answer
inversion is internally root position, with no initial highlighted answer.

| Quality | Semitone intervals from root | Initially active |
| --- | --- | --- |
| Major | 0,4,7 | Yes |
| Minor | 0,3,7 | Yes |
| Diminished | 0,3,6 | Yes |
| Augmented | 0,4,8 | Yes |
| Sus2 | 0,2,7 | Yes |
| Sus4 | 0,5,7 | Yes |
| Dominant 7th | 0,4,7,10 | Yes |
| Major 7th | 0,4,7,11 | Yes |
| Minor 7th | 0,3,7,10 | Yes |
| Half-diminished 7th | 0,3,6,10 | No |
| Diminished 7th | 0,3,6,9 | No |

**Controls:** Play Mystery Chord; Roll Arpeggio; Next Chord; per-generated-note
Voice audition buttons; voicing playback selector (block, arpeggio, both);
inversion selector (root only, random inversion/quality only, quality+inversion);
three inversion-answer buttons; eleven quality chips; four presets.

**Presets:** Core Triads = major/minor/diminished/augmented; Triads + Sus adds
sus2/sus4; 7ths = all five seventh qualities; All = eleven. Chips keep at least two.

A new question chooses an active quality and a root from active-pool notes in
C3–G4 (MIDI 48–67), falling back to C4 if none. Non-root modes randomly choose
inversion 0, 1, or 2. Voices for that inversion are raised an octave and sorted.
Third inversion of seventh chords is not generated or offered. Complete voicings
are not constrained to the chosen scale or vocal range.

Block playback is simultaneous. Arpeggio spaces notes by 0.32s. Both spaces
notes by 0.26s, then plays a block after `numberOfNotes×0.28 + 0.15` seconds.
Isolators audition individual tones. If Roll Arpeggio is the first action, the
new question initially follows the selected playback setting.

In quality+inversion mode, the quality button submits both the selected quality
and the stored inversion. Inversion buttons only change the stored choice; they
do not submit. The UI says “after or before choosing quality,” but changing an
inversion after a failed quality submission requires pressing quality again.
The stored inversion and visual selection are not reset for a new question.

**Code-executed assessment ambiguity:** `buildChordMidiNotes(60,[0,4,8],1)`
and `buildChordMidiNotes(64,[0,4,8],0)` both produce MIDI `[64,68,72]`.
Both roots are available in the default C-major pool. The same sounding
augmented voicing can therefore require different inversion answers without
an explicit reference root. This is a fairness issue in the product contract,
not evidence that a listener failed to recognize an objectively unique answer.

Wrong quality or inversion increments attempts and resets streak. Correct quality
with wrong inversion gives partial descriptive feedback but no partial score.
Full success reveals root, quality, supported inversion, and all voicing notes,
awards XP, and closes the round. No auto-advance.

| Baseline criterion | Observable expected preservation |
| --- | --- |
| B-CHORD-01.A | New questions use active qualities and the selected inversion mode; answers are graded against actual voicing. |
| B-CHORD-01.B | Quality and inversion expectations are clear; retries, voice isolation, and manual continuation remain usable. |
| B-CHORD-01.C | All eleven quality definitions remain available; supported inversion coverage is stated honestly. |

## 7. Harmony Studio and SATB mixer

### Target-harmony practice

Default root is C4; default challenge is a perfect fifth, target G4, backing C4.
The global Root Key does not directly transpose this stored harmony root.

| Challenge | Target offset | Backing offsets |
| --- | --- | --- |
| Major third above | +4 | 0 |
| Minor third above | +3 | 0 |
| Perfect fifth above | +7 | 0 |
| Major sixth above | +9 | 0 |
| Major triad, middle voice | +4 | 0,7 |
| Major triad, top voice | +7 | 0,4 |
| Minor triad, middle voice | +3 | 0,7 |
| Dominant seventh, top voice | +10 | 0,4,7 |

**Controls:** Harmony Target; Hold/Stop Backing Voices; Cue My Harmony Note;
Enable/Stop Mic; Simulate Full Blend; New Root Note.

The backing control toggles sustained voices until stopped. Cue plays the target
once. Full Blend auditions backing and target, labels the result Preview, and
does not award XP or a live lock. New Root selects a pool note in MIDI 48–67,
or C4 fallback, and auditions the backing. A target/root need not fit the full
selected vocal range. Changing challenge resets the lock and restarts backing
if already active.

Live harmony acceptance requires the shared real microphone, visible harmony
panel, visible browser document, and 1.5 continuous seconds within **±25 cents**
of the exact target. Silence/out-of-tune frames reset the hold. Completion shows
a lock message; it does not award XP, advance, or track progression performance.
The help text says ±20 cents, which differs from code.

### SATB minus-one practice

The four lanes are Soprano, Alto, Tenor, Bass. Each has a displayed pitch, an
Active/Muted toggle (“You Sing!”), and a Solo action. Solo auditions only that
lane's displayed pitch once; it is not a persistent solo mix. Before the first
progression, all Solo actions fall back to MIDI 60 even though displayed lane
notes are E4, C4, G3, and C3.

Progression root `r = MIDI 48 + global rootKey`. Each step starts 1.15s after the
previous one, plays for 1.05s, updates lane pitches, and respects mute flags at
the moment the scheduled step runs. Voice tuples below are offsets from `r`
in the order **(bass, tenor, alto, soprano)**.

| Choice | Current implemented sequence |
| --- | --- |
| Pop I–V–vi–IV | (0,7,12,16); (−5,7,11,14); (−3,9,12,16); (−7,5,9,12) |
| Classic I–IV–V–I | (0,7,12,16); (5,9,12,17); (7,11,14,19); (0,7,12,16) |
| Jazz ii7–V7–Imaj7–VI7 | (2,9,12,17); (7,11,14,17); (0,7,11,16); (9,7,13,16) |
| Barbershop | (0,7,12,16); (0,10,12,16); (5,9,12,17); (5,8,12,17); (0,7,12,16) |

The Barbershop label advertises I–I7–IV–iv–I–V7–I but plays five steps,
I–I7–IV–iv–I. The first Jazz tuple omits the third and duplicates the root class;
it does not establish a complete ii7 quality. A musical-content review is needed
before these labels become acceptance promises. The mixer has no pause/stop,
playhead, tempo, loop, per-lane gain, score, or target-following live assessment.
Repeated Play actions schedule overlapping progressions; mode switches do not
cancel pending steps.

## 8. Microphone tuner, drills, and lifecycle

### Controls and generation

| Control | Default / existing behavior |
| --- | --- |
| Drill Mode | Target Note Pitch Match. Options: Free Chromatic Tuner, Target, Scale Walk, Triad Arpeggio Climb. |
| Tolerance | Standard ±22c. Strict ±12c; Relaxed ±35c. Does not change harmony's fixed ±25c. |
| Start/Stop Microphone | Toggles shared capture used by tuner and harmony. |
| Play Target Note | Auditions current target for 1.15s. |
| Next Target | Advances without changing XP, streak, or accuracy. |
| Simulate Voice Input | With mic off, runs a 1.35s preview with small vibrato and plays a reference tone. Scores/locks remain unchanged. With mic active, asks the user to stop it first. |
| Queue entries | Clickable chips select any target, reset hold, and audition it. They are spans without native keyboard semantics. |

Target and Free modes both generate eight random active-pool notes. Free mode
does not award locks, but still shows a target and queue. Scale Walk takes the
first up to eight notes of the active pool and reverses them, excluding the
duplicated turnaround note. It is not necessarily a tonic-to-tonic octave for
every scale. Arpeggio uses a clamped base, then offsets `0, third, 7, 12, 7,
third, 0`, with minor third only when the scale ID contains `minor`; a range
narrower than an octave can still generate notes above the selected high note.

Queues wrap indefinitely. Completing a genuine target hold adds 20 XP, increments
streak and both aggregate correct/attempt counters, advances, and resets hold.
The next target is not automatically played. An unchanged sustained pitch may
complete adjacent repeated targets; there is no release/new-onset requirement.
There is no completed-queue summary, attempt timeout, or scoring of failed vocal
holds. Range/root/scale/notation/tuning refreshes rebuild the queue and lose its
position, even when the change is presentational.

**Code-executed boundary example:** With range C4–E4, C-sharp major, and
Arpeggio mode, actual source generation returned MIDI
`[60,64,67,72,67,64,60]`: a C-based major arpeggio extending above E4 and
not anchored to the selected tonic. UI/playback were stubbed in that execution.

### Capture and state contract

| State | Observed implementation |
| --- | --- |
| Off | On the normal path there is no stream; capture requires a user action. An always-running frame loop still draws history/grid. A partial initialization failure is an exception noted below. |
| Starting | `micStarting` prevents duplicate requests. No visible pending state, cancel, or timeout. |
| Active | Requests audio with echo cancellation, automatic gain, and noise suppression disabled; builds a 2048-sample analyser; updates both mode buttons. |
| Permission denied | Specific recovery copy is written to `mic-status-msg` in the mic panel. It may be invisible when capture was requested from Harmony. |
| Other failure | Generic microphone/localhost/HTTPS guidance, also only in the mic panel. No device-specific classification. |
| Stop | Stops every captured track, clears stream/analyser/buffer and holds, updates buttons and mic status. Last detected note/frequency/history are not cleared. |
| Tab switch | Capture continues; only the active product panel accumulates its relevant hold. No global capture indicator or globally available Stop. |
| Hidden browser document / frame gap >100ms | Hold resets. Capture is not explicitly stopped; output may continue. |
| Page hide | Stops microphone and sustained harmony backing. Scheduled one-shots/progression timers are not centrally cancelled. |
| Capture/device ends externally | No stream-ended/device-change listener updates the product state. |

If `getUserMedia` succeeds but later graph creation/connection fails, the catch
path reports an error without stopping the newly obtained stream. The product
can therefore report capture unavailable while holding a live track; this is a
source-observed cleanup gap, not a reproduced hardware incident.

### Pitch and visual feedback

The detector uses an RMS gate of 0.012, autocorrelation/normalized difference,
configured search limits of 65–1100Hz, peak threshold 0.78, early exit above 0.9,
and parabolic interpolation. These are implementation parameters, not verified
precision/latency guarantees. Range at a particular sample rate and robustness
to voice timbre, noise, harmonics, or speaker bleed require real-device testing.

Live display shows nearest note and nearest-note cents. In target mode the
pointer instead represents target-relative cents, clamped to ±50, so an octave
error can show “0 cents” while the meter is at an edge. In free mode the pointer
is nearest-note-relative. The target still anchors the history graph even in
free mode. History contains the last 160 animation-frame samples, so its time
span changes with frame rate; it is not a fixed-duration recording.

The graph is an 820×210 canvas scaled by CSS to full available width, with a
fixed 210px display height. It shows target±4 semitones, note lines, tolerance
band, and clamped pitch curve; long solfège/degree labels may need special layout.
There is no textual history alternative. Silence inserts a gap into history,
but leaves last detected pitch/frequency/cents displayed as if current.

## 9. Piano, audio, scoring, and storage

### Interactive piano

- Exactly 49 semitones C2–C6 are rendered. White keys are 38px wide plus margin;
  black keys are 24px, absolutely positioned; the region scrolls horizontally.
- Every key can be activated by click/tap or Enter/Space when focused and has a
  Play-note accessible name. The keyboard exposes 49 individual tab stops.
- All keys remain playable, including faded out-of-range keys. Scale markers
  show membership; blue playback and green detection highlights are transient.
- Piano activation auditions the note before optionally submitting it to an
  unresolved Notes question. Submission defaults on; elsewhere it only auditions.
  The accessible name does not announce the submission consequence.
- There is no octave-jump control, active-range centering, multi-touch/sustain,
  computer-key mapping, or external MIDI. The “Keyboard Shortcuts” help describes
  clicking keys rather than an implemented letter-key shortcut system.

### Audio engine

AudioContext is lazily created and resumed when suspended, without awaiting or
handling resume rejection. One-shot sounds are synthesized with envelopes and
scheduled oscillator stops; multiple actions may overlap. The sustained drone
uses its own triangle+sine tone and does not follow the selected instrument.
There is no shared master volume, mute, Stop All, or audio-unavailable state.
No recorded microphone audio is saved or transmitted by this application's code.
No external SDK, API request, font, media download, or analytics instrumentation
appears in this snapshot. This is source evidence, not a network/privacy audit.

### Scoring definitions

`s` below is the streak **after** the current correct answer increments it.

| Activity | XP / counters |
| --- | --- |
| Correct note | `15 + min(2s,30)`; +1 attempts, correct, streak, target-class attempts/correct. |
| Correct interval | `20 + min(2s,35)`; +1 aggregate attempts, correct, streak. |
| Correct chord and required inversion | `25 + min(3s,40)`; +1 aggregate attempts, correct, streak. |
| Wrong quiz guess | +1 attempts; streak becomes 0; Notes also increments target-class attempts. Repeated wrong guesses count individually. |
| Successful live mic target | 20 XP; +1 attempts, correct, streak. Failed/incomplete holds do not count as attempts. |
| Harmony lock, references, previews, skips | No XP or accuracy change. Skips leave streak unchanged. |
| Accuracy | Rounded `100 × correctAttempts / totalAttempts`; also displays exact fraction. No attempts displays an em dash and 0/0. |
| Streak | Consecutive correct grading events across eligible modes, persistent across reload; not a daily practice streak. |

Accuracy combines quiz guesses and only successful vocal holds. It should not
be interpreted as comparable performance across modes or as first-try accuracy.
There is no per-interval/chord mastery, session duration, long-term trend, or
practice history beyond aggregate counters.

### Storage contract

Storage key **`pitch_perfect_studio_v1`** contains `{xp, streak, totalAttempts,
correctAttempts, noteStats:[{attempts,correct} × 12]}`. Loading catches JSON/storage
errors and mostly uses falsy-value defaults; only array length is validated, not
counter types or cell contents. Malformed but parseable data can disrupt rendering.
Saving failure is silently ignored. No settings, active mode, current question,
queue, capture permission, or audio state is persisted. Reload restores the
default setup and Notes panel. Storage is browser/origin-specific; the original
file URL's stats do not automatically migrate to localhost. Reset is immediate
and irreversible through the app.

## 10. Mobile, desktop, accessibility, and performance baseline

| Area | Current source evidence | Assessment |
| --- | --- | --- |
| Responsive page | Viewport meta; flexible wrapping; one breakpoint at max-width 1024px stacks panel cards. | Partial responsive foundation, not a tested mobile/desktop contract. |
| Header | Full title, subtitle, stats, and all global settings remain sticky at every width. | Risk of a tall mobile header consuming practice space. |
| Navigation | Long no-wrap mode buttons in a horizontally scrollable strip. | Off-screen modes may be undiscovered; selected state is visual only. |
| Narrow content | Outer main padding 40px; card and stage padding each 40px; feedback has min-width 260px. | At 320px nested available width can be below 260px; body hides horizontal overflow instead of resolving it. Browser reproduction is pending. |
| Answer layouts | Auto-fill minimum 120px, wide answers 165px; full descriptions; many stacked actions. | Risk of excessive scrolling and weak primary/secondary hierarchy on phones. |
| Piano | Full-range fixed-size keyboard below all panel content. | Exact-octave answering can require substantial vertical and horizontal navigation. |
| Pointer controls | Small chips and small buttons; black keys 24px wide. | Touch accuracy/spacing and visible focus need device review; width alone does not establish conformance. |
| Keyboard | Native buttons/selects; piano Enter/Space; focus-visible outline. | Filter chips, queue chips, and note replay orb lack native keyboard behavior. |
| Tab/state semantics | Navigation buttons toggle classes; no active ARIA state, panel relationships, or tab keyboard model. | Use either correct navigation/selected-state semantics or a complete tab pattern in redesign. |
| Headings | Only main brand is an `h1`; card titles are styled divs. | Panel structure and heading navigation are not represented semantically. |
| Dynamic status | Feedback, meters, and lock bars lack live-region/progress semantics. | Screen-reader feedback and announcement frequency require design and testing. |
| Disabled answers | CSS pointer blocking only. | Out-of-scale answers remain keyboard-focusable/activatable. |
| Motion | Fade/transform transitions and glowing states; no reduced-motion rule. | Reduced-motion behavior is missing in source. |
| Chart | Canvas without textual equivalent or device-pixel-ratio resize logic. | Text alternative, readable scaling, and high-density display behavior unverified. |
| Continuous work | Frame loop always redraws canvas and queries/updates DOM, including hidden product panels; detector allocates/loops on main thread. | Idle and capture performance/battery impact are unmeasured risks. |

No browser/version support matrix, screen-reader audit, color-contrast
measurement, touch UAT, zoom/reflow validation, low-powered-device profiling,
network-offline verification, or real microphone latency/accuracy measurement has
been completed. “Supported on mobile and desktop” is a target requirement from
the user, not an established fact about this build.

## 11. Gap register and product decisions

All entries are source-observed unless explicitly called a risk. Priority and
resolution appear in the [improvement plan](ux-improvement-plan.md).

| Gap | Finding and user consequence | Related baseline |
| --- | --- | --- |
| G-01 | Dense sticky shared setup competes with the exercise, especially on narrow screens (layout risk). | B-SHELL-01, B-CONFIG-01 |
| G-02 | Long horizontal tabs can hide modes; no onboarding or mode-selection guidance. | B-SHELL-01 |
| G-03 | Nested padding/min-width can clip narrow feedback; `overflow-x:hidden` can conceal it (layout risk). | B-SHELL-01 |
| G-04 | Exact-octave input depends on a distant piano and a separate default-on toggle; clicking a piano key also auditions it before grading. | B-NOTE-01, B-PIANO-01 |
| G-05 | Active targets survive range/scale/filter changes; a valid answer can disappear from the current answer set. | B-CONFIG-01, B-NOTE-01, B-INT-01, B-CHORD-01 |
| G-06 | Note auto-next and progression timers are not cancelled on new rounds, navigation, or setup changes; overlapping/stale playback can occur. | B-NOTE-01, B-SATB-01 |
| G-07 | Preset label can disagree with manually edited range; tuning field can disagree with its clamped internal value. | B-CONFIG-01 |
| G-08 | Interval upper notes, chord voicings, harmony targets, and narrow-range arpeggios can exceed selected range; some also leave the selected scale. Actual-source isolated execution confirmed F4→F5 under C4–C5 octave training and a C4–C5 arpeggio under C4–E4/C-sharp-major setup. | B-CONFIG-01, B-INT-01, B-CHORD-01, B-HARM-01, B-MIC-01 |
| G-09 | First-action melodic/harmonic/arpeggio overrides do not match the initiating button in some states; melodic replay always ascends. | B-INT-01, B-CHORD-01 |
| G-10 | Inversion selection has implicit/persistent state, awkward submission order, and no seventh-chord third inversion. | B-CHORD-01 |
| G-11 | Harmony root ignores direct global key transposition; help tolerance and code disagree. | B-HARM-01 |
| G-12 | Initial SATB Solo notes do not match displayed notes; Barbershop sequence and Jazz chord content need correction or relabeling. | B-SATB-01 |
| G-13 | Shared mic errors appear only in Mic panel; no pending/cancel/device-ended state or global capture/Stop affordance. Failure after stream acquisition does not stop the acquired track. | B-MIC-01, B-HARM-01 |
| G-14 | Silence/stop leaves stale detected values; target-relative pointer and nearest-note cents can disagree. Free tuner still shows target/queue. | B-MIC-01 |
| G-15 | Global presentational changes rebuild queue and reset practice; queue completion has no endpoint or review. | B-MIC-01 |
| G-16 | Aggregate accuracy mixes unlike denominators; “session mastery” is persistent; “streak” could imply a daily streak. | B-STATS-01 |
| G-17 | No protection/undo for stats reset; storage failure and malformed saved values have no usable recovery. | B-STATS-01 |
| G-18 | Chips, orb, navigation state, disabled answers, headings, chart, and status feedback have accessibility gaps. | All interactive baseline capabilities |
| G-19 | No reduced-motion treatment; idle/render/capture performance is unmeasured. | B-SHELL-01, B-MIC-01 |
| G-20 | No bounded session, first-success pathway, return-to-practice setup, or differentiated beginner/expert help. | B-SHELL-01, B-STATS-01 |
| G-21 | Reference playback may be picked up as live input; no scoring exclusion window or headphone setup flow. Hardware consequence unverified. | B-MIC-01, B-HARM-01 |
| G-22 | Nominal 65–1100Hz search bounds contain C2≈65.4Hz through C6≈1046.5Hz at default A4=440. At the allowed A4=430 setting, however, C2≈63.9Hz is below the fixed detector floor, so the full-range/tuning combination exceeds the nominal detection contract. Other boundary accuracy, sample-rate, timbre/noise, and device effects remain unverified. | B-CONFIG-01, B-MIC-01 |
| G-23 | Identical augmented voicings can require different inversion answers because hidden reference roots differ; actual-source chord construction confirmed the equivalence. | B-CHORD-01 |

### Decisions the next spec must make explicit

- Is selected range a hard constraint for every sounding voice, or specifically
  the learner's sung target? Recommended distinction is in UX-09.
- Does selected scale constrain targets, roots, full chords, or all of the above?
  Current implementation treats these differently by mode.
- Should exact-octave guesses audition before submitting? The current action
  combines reference playback and assessment in a way that may confuse intent.
- What is a vocal attempt, and should it enter quiz accuracy? Recommended
  separation avoids a false aggregate mastery measure.
- Should repeated target pitches need a new onset? This affects accessible
  sustained practice and scoring integrity; it needs deliberate product choice.
- Which initially supported browser/device combinations will be verified? The
  proposed release matrix specifies execution targets without claiming results.

## 12. Completion and handoff

The source audit covers the current shell, every static control, generated
answer/filter/queue/voice actions, music vocabulary, capture/playback states,
scoring/storage, and responsive/accessibility limitations. It cannot prove an
absence of all bugs. The next artifact turns the gaps into proposed requirements,
scoped implementation tickets, and testable mobile/desktop acceptance criteria.
No application behavior was changed while writing this specification.
