> Historical planning document. The standalone prototype and design preview have been retired.
> See the [current README](../../README.md) and [architecture](../architecture.md) for the maintained app.

# Pitch Perfect Studio — proposed UI/UX and usability specification

**Revision:** 1.0, 2026-11-03.\
**Status:** Product recommendations and implementation-ready backlog; not yet implemented or stakeholder-accepted.\
**Baseline:** [Current product specification](product-spec.md).\
**Requested outcome:** A detailed, spec-driven improvement plan that makes the same music-training product sensible on mobile and desktop.

**Architecture update:** The user accepted React, strict TypeScript, Vite,
Tailwind CSS, shadcn/ui, and Motion as the target stack. This replaces the initial
vanilla-stack handoff assumption; individual UX proposals and UAT statuses below
retain their stated status. See the revised [technical design](technical-design.md).

## 1. Product direction

Make the app feel like a **pocket rehearsal room**: immediate to enter, clear about
what to do next, expressive when a learner makes progress, and calm enough for
focused listening. Preserve all five modes and every useful advanced setting.
The largest usability opportunity is hierarchy and flow, not adding more modes.

The baseline exposes setup, theory, feedback, scorekeeping, and audio controls
at once. The proposal puts the current exercise first, places setup and learning
support within easy reach, and makes live audio state unmistakable. Musical
personality should come from encouraging language, rhythmic visual details,
clear musical notation, and brief purposeful feedback—not decorative noise.

The recommendations are based on source review and the user's stated goals.
They are hypotheses to validate, not findings from interviews or observed users.
Priorities below are proposed; there are no committed owners, estimates, dates,
tracker records, or release approvals.

**User-agreed direction:** Audit the complete app, specify it in detail, prioritize
UI/UX and usability improvements, and support both mobile and desktop sensibly.
**Proposed product choices:** The particular layout bands, bottom navigation,
setup transaction, piano alternative, scoring refinements, session features,
and delivery order below are recommendations, not already-approved design
decisions or implemented functionality.

### Delivery principles

1. **Hear or sing before configuring everything.** A sensible default and one
   primary action get a learner to the first meaningful exercise.
2. **A control should explain its consequence.** Separate replay, submit, skip,
   preview, listening, and completed states.
3. **One product, adapted compositions.** Do not shrink a desktop dashboard onto
   a phone or remove advanced capabilities to make the phone fit.
4. **Trust is part of usability.** Feedback, scoring, musical content, and visible
   microphone state must tell the same story as the actual behavior.
5. **Delight follows action.** Celebrate an earned result without masking errors,
   slowing the exercise, or relying on audio, color, or animation alone.

## 2. Proposed information architecture

Primary destinations remain **Notes, Intervals, Chords, Harmony, Tuner**. Use
short, recognizable labels in navigation and full descriptive headings inside
each mode. Each mode has three conceptual surfaces:

- **Practice:** Current task, listen/reference actions, answer or live input,
  feedback, and continuation. This is the default surface.
- **Setup:** Contextual exercise controls plus shared musical setup. Preserve
  range, root, scale, instrument, notation, and tuning, with relevance explained.
- **Learn / Progress:** Optional explanation, examples, mastery, and review.
  Keep these reachable without interrupting the current task.

Do not create three new competing navigation systems. Setup can be a button and
Learn / Progress a secondary disclosure. Desktop can expose those same surfaces
as adjacent panels while mobile opens them on demand.

### Layout contract

Bands are proposed composition choices, not device detection. Actual breakpoints
may shift slightly after content testing while satisfying the same acceptance
criteria. Test 320px reflow even if typical target phones are wider.

| Element | Compact: 320–767 CSS px | Medium: 768–1199 CSS px | Wide: ≥1200 CSS px |
| --- | --- | --- | --- |
| Header | Compact brand/mode context and Setup; avoid a full sticky configuration wall. At most one compact top row remains sticky. | Compact toolbar with key/range summary and Setup. | Brand, active musical setup summary, compact progress, audio state; advanced fields stay in a panel. |
| Mode navigation | Five equal destinations in a bottom navigation row with short labels, visible selected state, and safe-area padding. All remain visible at 320px without horizontal tab scrolling. | Horizontal five-mode navigation above practice, with short labels. | Horizontal five-mode navigation; avoid duplicating it in a sidebar. |
| Practice area | Single column: task → primary playback/input → answer controls → feedback → Next. Repeated controls remain close to their result. | Main exercise plus collapsible secondary content; use two columns only when both retain usable widths. | Broad practice stage plus an approximately 280–360px contextual rail; cap reading widths rather than stretching text. |
| Setup | Accessible full-screen panel or sheet with grouped settings, explicit Apply/Cancel, current values, and a clear return to the exercise. Scroll inside it without losing its title/actions. | Drawer or panel with the same grouping and transaction. | Contextual side panel or drawer; common settings summarized in toolbar. |
| Answers | Notes use a deliberate compact grid; intervals/chords favor readable short names with expandable memory cues. No horizontal page scrolling. Exact octave uses a nearby note+octave alternative. | Denser grid where content fits; preserve the same labels and state semantics. | Wider answer grid with optional hints; full names and keyboard hints where implemented. |
| Piano | Collapsed “Keyboard” launcher except when needed for the chosen answer method; open a nearby octave-focused region. Provide direct octave selection and equivalent native note/octave inputs. | Optional octave-focused dock/region with range navigation. | Optional wider dock with available range, octave-jump controls, and clearly separate Audition / Answer mode. |
| Live mic / Stop | Persistent compact Listening/Waiting/Error indicator and reachable Stop above bottom navigation while capture is active. It must not cover feedback, inputs, or focused elements. | Always-visible audio status with Stop in shared toolbar. | Always-visible audio status and Stop in shared toolbar; mode-specific controls remain in practice. |
| Learn/reference | Collapsible drawer/disclosure after practice; references can be auditioned without resetting the round. | Optional rail/disclosure. | Contextual rail for examples, filters, voice guidance, and mastery; it must not steal the primary action's hierarchy. |
| Progress | Compact session/round status near task; detailed history/mastery is optional. | Compact summary and expandable detail. | Compact summary plus review panel; no permanent wall of unrelated KPIs. |
| Feedback | Inline text close to answer/input; reserve space for changing copy. Scroll into view only when necessary, without unexpected focus moves. | Same behavior. | Same behavior; do not place result far from selected answer. |

Illustrative structure; not a final visual design:

```text
COMPACT                              WIDE
┌ Brand / current mode      Setup ┐   ┌ Brand   Key · Range   Progress  Audio/Stop ┐
│ Task + active setup summary    │   │ Notes  Intervals  Chords  Harmony  Tuner    │
│ Play / Replay · Reference      │   ├──────────────────────────┬───────────────────┤
│ Answer grid / live pitch       │   │ Current task             │ Setup / Learn     │
│ Feedback + next action         │   │ Playback · answer/input  │ Filters/examples  │
│ Learn / Progress disclosure    │   │ Feedback · continuation  │ Optional mastery  │
│ [Keyboard when needed]         │   ├──────────────────────────┴───────────────────┤
├ Listening · Stop (when active) ┤   │ Optional keyboard · octave navigation         │
└ Notes Intervals Chords Harm Tune┘   └──────────────────────────────────────────────┘
```

Portrait and landscape retain the same actions and settings. In short landscape
viewports, collapse optional keyboard/learning regions and reduce sticky chrome
rather than consuming most of the viewport. Software keyboards must not obscure
the edited field, Apply/Cancel, or Stop. At 200% text size and 400% browser zoom,
the composition should reflow instead of clipping or hiding essential controls.
The W3C reflow guidance uses a 320-CSS-pixel equivalent width; any exception for
content inherently requiring two dimensions applies to that component, not the
entire app. [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## 3. Proposed requirements and acceptance criteria

Each `UX-*` requirement is a proposal. Criteria retain stable letter suffixes for
ticket implementation and UAT. The source gaps refer to the baseline register.

### UX-01 — Put practice and mode discovery first

**Addresses:** G-01, G-02, G-03, G-20. **Priority:** P1.

- **UX-01.A:** All five modes are visible and reachable in one navigation action
  on compact, medium, and wide layouts; selected mode is visually and
  programmatically identifiable. Full mode meaning is available through its heading.
- **UX-01.B:** The default Notes screen presents the task, active setup summary,
  and a single dominant Start/Play action before optional theory or aggregate
  statistics. Starting the default exercise requires no settings changes.
- **UX-01.C:** At 320px, at representative medium/wide widths, and at supported
  zoom, page content has no horizontal clipping/scrolling. An optional piano may
  have its own labeled horizontal region; essential answers do not depend on it.
- **UX-01.D:** Mode changes preserve musical setup, cancel the outgoing exercise's
  pending continuation/playback, and announce the destination. They never start
  a new question automatically in a hidden panel.

### UX-02 — Make setup understandable, contextual, and predictable

**Addresses:** G-01, G-05, G-07, G-15. **Priority:** P1.

- **UX-02.A:** Every current global setting, module playback mode, filter, preset,
  tolerance, exact-octave option, and auto-advance choice remains reachable from
  clearly grouped Setup; users can see their active key/range/mode without opening it.
- **UX-02.B:** Editing Setup uses a draft. Cancel restores the prior configuration
  and current round. Apply commits valid changes once, explains any new-round
  reset, and cancels stale timers. A behavior-changing edit invalidates the old
  round and prepares a valid new round/queue in **Ready**, without automatically
  playing audio or starting capture. The learner explicitly uses Play/Start to
  continue; applying a configuration is not an implicit playback request.
- **UX-02.C:** Manual range changes display Custom; invalid/corrected tuning and
  range values are reflected in the field and explained. Empty/impossible target
  sets show a recoverable setup message rather than silently substituting C4.
- **UX-02.D:** Notation-only changes preserve question identity, queue position,
  earned progress, and audio state. Range/filter changes follow the explicit
  musical rules in UX-09; no hidden target remains outside its answer set.

### UX-03 — Unify exercise lifecycle and feedback

**Addresses:** G-05, G-06, G-09, G-10. **Priority:** P0 for correctness; P1 for presentation.

- **UX-03.A:** Notes, Intervals, and Chords expose Ready, Playing/Listening,
  Awaiting answer, Incorrect/retry, Correct, and Skipped/Next states consistently.
  Play becomes Replay for an unresolved round; Next starts exactly one new round.
- **UX-03.B:** The initiating playback action is honored from Ready as well as
  during a round: Hear Harmonic is harmonic, Hear Melodic respects the stated
  direction, and Roll Arpeggio is an arpeggio. Replay does not change the question.
- **UX-03.C:** Correct feedback explains the answer; wrong feedback gives a useful
  next step. Repeated or rapid input cannot award credit twice or overlap an
  unintended queue of rounds. Auto-advance is optional, announced, cancellable,
  and cancelled on navigation, Skip, or applicable setup changes.
- **UX-03.D:** In quality+inversion mode, choose quality and inversion explicitly,
  then use Check Answer. Each new round resets both answer selections; feedback
  identifies which part needs another listen. The supported inversion set is visible.

### UX-04 — Bring exact-octave answers and piano interaction into reach

**Addresses:** G-04, G-18. **Priority:** P1.

- **UX-04.A:** Selecting exact-octave mode reveals nearby native note+octave
  answer controls and an explicit Check Answer action. A piano remains an
  alternative, not the only path. Missing octave is explained without a scored attempt.
- **UX-04.B:** The piano declares Audition or Answer mode before activation. It
  never silently submits from a control labeled only Play. Audition does not grade;
  Answer grades without first exposing the guessed pitch as reference playback.
- **UX-04.C:** Compact piano shows a manageable octave window with current octave,
  previous/next octave actions, active-range indicators, and access to C2–C6.
  All pitches remain reachable without shrinking keys to fit 49 notes onscreen.
- **UX-04.D:** Native answer controls provide an equivalent path for touch,
  keyboard, and assistive technology. Piano keyboard focus/navigation is documented
  and efficient; no new letter-key shortcuts are claimed unless implemented and tested.

### UX-05 — Give audio and microphone a visible, recoverable lifecycle

**Addresses:** G-06, G-13, G-19, G-21. **Priority:** P0.

- **UX-05.A:** Playback and capture start only through an intentional user action.
  Audio-unavailable/resume-failed states show an actionable Retry message instead
  of presenting successful listening. No autoplay assumption is used as a browser
  support promise. [MDN: Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- **UX-05.B:** Off, Awaiting permission, Listening, Silent/No usable pitch, Denied,
  Unavailable, Interrupted, and Stopped are distinguishable. Status and Stop are
  visible from either Harmony or Tuner and in the shared shell while capture is active.
- **UX-05.C:** Waiting for permission offers Cancel. Cancel invalidates that
  request; if permission later resolves, its stream is immediately stopped instead
  of activating a cancelled task. Retry cannot leave multiple live streams.
  Permission can remain unanswered; a UI waiting state must not imply a browser
  timeout guarantee. [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- **UX-05.D:** A shared Stop All action stops capture, sustained backing, scheduled
  playback, and pending progression/continuation callbacks. Every mode change
  cancels outgoing playback and auto-advance and resets holds. Switching directly
  between **Harmony and Tuner** may retain the same capture stream, with its shared
  visible status and Stop; switching to **Notes, Intervals, or Chords** stops
  capture. Cleanup also handles page hide, capture initialization failure, and
  externally ended tracks. Retained capture never carries hold credit between modes.
- **UX-05.E:** First live-input use explains local processing and headphone advice,
  with a short permission recovery path appropriate to the originating panel.
  Reference/cue/preview playback is excluded from graded microphone windows and
  clears an in-progress hold; acceptance resumes after that playback ends.
- **UX-05.F:** A master output-volume control and mute are available from both
  layouts, with an accessible value and persistent in-session setting. Muting
  output does not falsely imply capture has stopped; capture status remains explicit.

### UX-06 — Make live pitch feedback musically and visually consistent

**Addresses:** G-14, G-15. **Priority:** P1.

- **UX-06.A:** Free Tuner displays detected note, nearest-note cents, frequency,
  and clear flat/in-tune/sharp text; target, drill queue, earned-lock progress, and
  Next Target are absent or explicitly inactive. Its graph follows detected pitch
  rather than an unrelated random target.
- **UX-06.B:** Target modes distinguish “Nearest note” from “Distance to target.”
  Meter, signed cents, octave guidance, and hold use the same target reference;
  an octave-wrong note cannot appear at 0 target cents. Indicate beyond-range meter
  values rather than concealing them with an unlabeled clamp.
- **UX-06.C:** Silence, unusable input, Stop, and interruption clear or label stale
  measurements. Idle copy invites an action; listening-but-silent copy says what
  to try next. A steady pitch must remain continuously in tolerance for 1.5s;
  breaking the hold resets it without a shaming message.
- **UX-06.D:** History uses a labeled fixed time window and responsive rendering
  with a useful text summary. Target and tolerance changes update the graph
  consistently. Device performance must not quietly change the represented time.

### UX-07 — Turn harmony and the mixer into understandable practice flows

**Addresses:** G-06, G-11, G-12, G-13. **Priority:** P1; content corrections P0.

- **UX-07.A:** Harmony presents a guided sequence: hear backing → cue target if
  needed → enable/listen → hold target → result. Backing, user's target, and sung
  pitch are distinct; all eight existing challenges remain available.
- **UX-07.B:** The displayed harmony tolerance matches its grading value. Changing
  challenge/root resets the hold and updates backing/target together; global-key
  behavior follows UX-09 instead of retaining an unexplained old root.
- **UX-07.C:** Mixer lanes say Audition Voice for one-shot solo playback and
  Mute / You Sing for accompaniment removal. Audition matches the displayed pitch
  before and after any progression. Four lanes remain practical on a phone.
- **UX-07.D:** Progression playback has Play/Replay, Stop, current step, and an
  honest sequence label. Repeated Play replaces or replays deliberately rather
  than stacking timers. All four progression choices have musically reviewed,
  label-matching note content. Do not imply real-time assessment of the muted
  moving voice unless that additional capability is actually implemented.

### UX-08 — Make the complete interface operable and accessible

**Addresses:** G-03, G-18, G-19. **Priority:** P1.

- **UX-08.A:** Every interactive chip, answer, navigation item, orb alternative,
  queue entry, mixer control, and disclosure has semantic keyboard operation and
  a clear name/state. Out-of-scale/unavailable answers are actually disabled or
  removed with an explanation; they cannot score through keyboard activation.
- **UX-08.B:** Navigation has correct selected-state/panel relationships; headings
  describe mode structure. Setup dialogs manage focus, support dismissal, restore
  focus to the launcher, and do not trap users in hidden/inert content.
- **UX-08.C:** Meaningful feedback/status is available as text and announced
  appropriately; do not announce every animation-frame pitch update. Progress
  bars expose name, value, and completion. Charts have a useful textual equivalent.
- **UX-08.D:** Adopt 44×44 CSS px as the preferred touch target for standalone
  controls, with suitable spacing. Evaluate any compact piano exception together
  with equivalent note/octave controls. WCAG 2.2 AA's target-size minimum is
  24×24 CSS px or its listed alternatives/exceptions, not 44×44.
  [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **UX-08.E:** Text, controls, selected/error states, and focus pass measured
  applicable contrast requirements. At 200% text and 400% zoom, controls and copy
  remain usable; sticky controls never cover the focused element or result.
- **UX-08.F:** Reduced motion replaces decorative movement with clear static
  feedback. Sound and color are supplementary; every action/result remains
  understandable without them. A screen-reader/keyboard user can complete every
  workflow that does not inherently require hearing or producing a musical pitch.

### UX-09 — Define valid musical setup and fair assessment

**Addresses:** G-05, G-08, G-10, G-11, G-12, G-22, G-23. **Priority:** P0.

- **UX-09.A:** The chosen range is a hard limit for generated note targets, both
  interval notes, and the user's sung harmony/drill targets. Chord/accompaniment
  voicings may extend beyond it only with clear “target range / backing range”
  labeling. If an exercise cannot fit, explain the incompatible constraint and
  offer a valid preset or range adjustment; do not silently fall back to C4.
- **UX-09.B:** The UI explains scale scope: note/drill targets use the selected
  scale; intervals are chosen by distance from a valid root and need not stay in
  that scale; chords use selected quality with roots from the selected scale.
  Harmony uses the selected key's tonic in a feasible octave, with challenge
  tones determined by the chosen interval. Changing key transposes/rebuilds
  accordingly; no hidden old target survives.
- **UX-09.C:** Arpeggios and scale walks begin from the displayed tonic when feasible,
  remain within target range, and explain their actual form. A range too narrow
  for the promised exercise gets a recoverable incompatibility message. Major/minor
  third choice is explicit for scales whose chord quality is otherwise ambiguous.
- **UX-09.D:** Seventh-chord inversion scope is explicit. Either support and
  label third inversion when graded, or state the chosen limited training set.
  Do not present a complete inversion curriculum while silently omitting it.
- **UX-09.E:** Inversion grading must not demand an acoustically unidentifiable
  answer. For symmetric/ambiguous qualities, provide an explicit reference root,
  accept equivalent interpretations, or exclude that quality from inversion
  assessment with an explanation. Confirm the chosen policy with musical fixtures.
- **UX-09.F:** Review synthesized examples, progression labels/notes, tuning,
  octave naming, and detected range boundaries against deterministic musical
  fixtures plus real input, including C2 at A4=430, 440, and 448Hz. The detector's
  declared range must follow supported tuning or explain an incompatible target;
  a fixed 65Hz floor does not cover C2 at A4=430. Content corrections are recorded in the spec rather
  than silently changing educational promises.

### UX-10 — Make progress, saved setup, and reset trustworthy

**Addresses:** G-07, G-15, G-16, G-17, G-20. **Priority:** P1.

- **UX-10.A:** Explain XP, correct-answer streak, and quiz accuracy with their
  actual definitions. Separate vocal target completions from quiz accuracy; do
  not compare unlike denominators under a mastery label. Existing aggregate
  values remain readable as Legacy progress if they cannot be accurately separated.
- **UX-10.B:** Mastery states whether it covers the current session or saved
  history and shows sample size. “Not practiced yet” differs from poor accuracy.
  Per-mode results use only data actually collected; unknown historical breakdowns
  are not reconstructed or fabricated.
- **UX-10.C:** Persist valid musical setup and relevant mode preferences locally
  so returning users can resume their setup; microphone and playback always return
  off. Preserve `pitch_perfect_studio_v1` and existing scores through a versioned,
  validated migration rather than overwriting incompatible data.
- **UX-10.D:** Reset states exactly what is cleared and offers confirmation or
  a reliable undo. Settings are separate from progress reset. Invalid saved data
  and storage-unavailable failures recover to a usable app with clear local-save
  status; no crash or invented successful save.

### UX-11 — Help the learner reach a first success

**Addresses:** G-02, G-04, G-20, G-21. **Priority:** P2 after core usability.

- **UX-11.A:** First use offers a brief, skippable goal choice: identify sounds,
  sing in tune, or practice harmony. It recommends a suitable existing mode and
  preset, labels it a recommendation, and leaves all advanced controls available.
- **UX-11.B:** A short “How this round works” explains Listen, Answer/Sing,
  Feedback, and Next, plus reference use and exact-octave rules when relevant.
  Help is reopenable and does not reset the current round.
- **UX-11.C:** Define terms such as cents, semitones, inversion, and solfège where
  used, with examples when helpful. Song anchors are optional and clearly generic
  interval demonstrations; no copyrighted song recording is implied.

### UX-12 — Preserve responsiveness and efficient real-time behavior

**Addresses:** G-19 and continuous-work baseline risks. **Priority:** P1.

- **UX-12.A:** When no active visualization/capture needs a frame loop, the app
  stops that continuous work. Hidden product panels do not redraw at display
  frame rate. Lifecycle cleanup prevents duplicate loops/listeners.
- **UX-12.B:** On the agreed baseline mobile and desktop test devices, profile
  input responsiveness, rendering, and detector cost during a real drill. Record
  device/browser and measurements before and after optimization; passing syntax
  tests is not performance evidence. Establish numerical budgets from this baseline
  before claiming a release target or improvement percentage.
- **UX-12.C:** Pitch-lock duration and chart time stay consistent across supported
  refresh rates, ordinary frame jitter, and orientation/size changes. Hidden or
  interrupted input cannot accumulate a lock. Playback remains uninterrupted by
  layout changes on the devices actually verified.

### UX-13 — Give practice a satisfying, optional rhythm

**Addresses:** G-15, G-20. **Priority:** P2.

- **UX-13.A:** Offer an optional finite round/queue goal, visible completion count,
  Pause/Finish, and a review with actual outcomes and a suggested next exercise.
  Free exploration remains available; do not force every practice action into a session.
- **UX-13.B:** Short musical microcopy and visual accents celebrate earned results
  while keeping Play, Check Answer, Next, Stop, and setup labels literal. Example:
  “Locked in. Ready for the next note?” with the actual result displayed beside it.
- **UX-13.C:** Simulated/preview actions never enter earned results, XP, mastery,
  or session completion. Skips are visible as skips; users are not punished or
  shamed for retrying, using references, pausing, or adjusting their vocal range.

### UX-14 — Verify mobile and desktop as equal product paths

**Addresses:** All layout gaps and the user's explicit device-support requirement. **Priority:** P1 release acceptance.

- **UX-14.A:** Execute the device/browser matrix and scenarios below, recording
  actual results and evidence. Support claims name tested combinations and limits;
  responsive CSS alone does not establish device support.
- **UX-14.B:** A mode/control parity inventory covers all baseline capabilities
  and advanced options on compact, medium, and wide layouts. A different placement
  is acceptable; an inaccessible/missing capability requires an explicit scope decision.
- **UX-14.C:** Complete a small usability validation with representative learners
  before calling the redesign intuitive. Report recruitment, tasks, observations,
  unresolved friction, and limits; do not present proposed metrics as measured results.

## 4. Concrete redesigned flows

### First note, then another

Open Notes → read “Listen, then choose the note” and setup summary → Play Note
→ Replay / optional reference → choose answer → Check Answer where the selected
input method requires confirmation → clear correct/retry feedback → Next or
optional auto-advance. On a phone, answers and feedback stay together; Learn is
collapsed. On desktop, optional references/mastery occupy the rail. Changing
Setup uses Apply and resets to a clearly indicated Ready state only when needed;
the next playback remains an explicit Play/Start action.

### Exact-octave recognition

Enable Exact Octave → nearby note and octave selectors appear → listen → select
note+octave → Check Answer. An optional keyboard can submit in clearly labeled
Answer mode. Missing octave does not count as wrong. Switching to Audition
states that it will provide a reference and will not submit an answer. This
removes dependence on a footer that may be far away on mobile.

### Chord quality plus inversion

Choose the supported vocabulary/inversion set → Play Chord → optionally isolate
voices → choose quality → choose inversion → Check Answer → feedback separates
quality from inversion → retry or Next. With ambiguous symmetric qualities,
show the reference-root context or apply the explicitly chosen equivalence policy.
Neither quality nor a default hidden inversion submits prematurely.

### Singing in tune

Choose Tuner / Target → see target/range and hold requirement → optional Play
Target → Start Microphone → Awaiting permission / Cancel → Listening → usable
pitch plus target error → hold progress → earned completion → next target.
Headphone advice and reference-scoring exclusion keep playback from counting
as the learner's performance. Silence shows “Listening—try a steady note,” not
the old pitch. Stop is always available, including in compact navigation.

### Harmony rehearsal

Choose challenge → hear backing → cue target → enable mic → hold target → result.
For minus-one work, switch the local submode to Mixer → choose progression →
Audition Voice → Mute / You Sing → Play Progression with current step → Stop.
The phone shows each voice as a clear stacked lane; desktop may show four lanes
side by side. This plan preserves guided target matching and moving-progression
practice as distinct activities instead of implying the mixer grades the singer.

## 5. Prioritized proposed tickets

`PPS-*` are local planning identifiers, not published tracker tickets. All statuses
are **Proposed**. P0 addresses misleading/unreliable outcomes; P1 delivers core
mobile/desktop usability; P2 adds guided practice and personality after foundations.

| Ticket | Priority | Outcome / scope | Source and acceptance | Dependencies |
| --- | --- | --- | --- | --- |
| PPS-01 | P0 | Make quiz transitions atomic: one active round, cancelled timers, answerable targets, truthful playback overrides, explicit chord submission. Preserve scoring rules until PPS-10 separates definitions. | UX-03.A–D; G-05/06/09/10 | Musical validity policy from PPS-02 for generated targets. |
| PPS-02 | P0 | Enforce and explain musical range/scale scope; resolve harmony key, narrow arpeggios, inversion scope/symmetry, and musical-content fixtures. Correct or relabel SATB content before presenting it as reviewed. | UX-09.A–F; G-08/10/11/12/22/23 | No application dependency; unresolved inversion policy is an explicit product decision. |
| PPS-03 | P0 | Implement shared audio state, permission waiting/cancel/retry, capture cleanup, Stop All, reference-score exclusion, and output volume/mute. | UX-05.A–F; G-06/13/21 | None; shell placement integrates with PPS-04. |
| PPS-04 | P1 | Build the practice-first responsive shell with five reachable modes, compact safe-area navigation, medium composition, wide practice/rail layout, and reflow. | UX-01.A–D; G-01/02/03 | PPS-01/03 lifecycle contracts; React/TypeScript foundation from the revised technical design. |
| PPS-05 | P1 | Add grouped contextual Setup with draft Apply/Cancel, active summaries, custom range, normalized fields, and change-impact behavior. | UX-02.A–D; G-01/05/07/15 | PPS-01/02, shared shell PPS-04. |
| PPS-06 | P1 | Add nearby exact-octave entry and an optional octave-focused piano with explicit Audition/Answer behavior. Preserve C2–C6 access. | UX-04.A–D; G-04/18 | PPS-01/04/05. |
| PPS-07 | P1 | Rework Free/Target tuner presentations, consistent error reference, silence/reset states, responsive fixed-time history, and target queue clarity. | UX-06.A–D; G-14/15 | PPS-02/03/04. |
| PPS-08 | P1 | Separate Harmony target practice from Mixer practice; correct tolerance/labels, match initial auditions, add progression playhead and Stop, preserve all challenges/lanes. | UX-07.A–D; G-06/11/12/13 | PPS-02/03/04. |
| PPS-09 | P1 | Complete semantic controls, selected/disabled states, focus management, measured contrast, touch targets, status summaries, text alternatives, and reduced motion across modes. | UX-08.A–F; G-03/18/19 | Applies throughout PPS-04…08; do not defer basic accessibility to the end. |
| PPS-10 | P1 | Define progress honestly, separate vocal completion/quiz accuracy, preserve legacy scores, save validated preferences, and make reset/storage recovery understandable. | UX-10.A–D; G-07/15/16/17 | PPS-01/05; migration design before writing new fields. |
| PPS-11 | P1 | Profile real-time UI/audio on selected devices; eliminate idle/hidden work and verify time-based behavior under resize and frame jitter. | UX-12.A–C; G-19 | Initial PPS-03/04/07 implementation and real test devices. |
| PPS-12 | P1 | Execute capability parity, browser/device UAT, and focused usability tasks; document remaining defects and a readiness recommendation. | UX-14.A–C; all applicable criteria | Feature tickets under test; device/browser access and representative participants. |
| PPS-13 | P2 | Add skippable goal-led first-use guidance and contextual vocabulary/reference help. | UX-11.A–C; G-02/04/20/21 | PPS-04/05/06/07/08. |
| PPS-14 | P2 | Add optional bounded practice and earned-result review with musical microcopy and restrained delight. | UX-13.A–C; G-15/20 | PPS-01/07/10/13. |

For tracker publication, use the existing team's conventions and attach the
referenced criterion text to each ticket. Include known owner/estimate/build
only when assigned. Discovery decisions about symmetry, target range, and
measurement do not justify marking implementation or UAT complete.

### Suggested delivery order

1. **Trustworthy practice:** PPS-01, PPS-02, PPS-03. These prevent a prettier
   interface from retaining unanswerable questions, misleading feedback, or
   hidden capture/playback.
2. **Mobile and desktop foundation:** PPS-04 and PPS-05, implementing PPS-09's
   semantics/focus/reflow expectations as components are built.
3. **Mode usability:** PPS-06, PPS-07, PPS-08, PPS-10; profile via PPS-11 and run
   PPS-12 scenarios on each completed increment.
4. **Guidance and vibe:** PPS-13 and PPS-14 after the core paths are usable.

## 6. UAT environment, parity, and execution matrix

**Current execution status:** No browser/hardware UAT was executed. The 13 passing
Node regressions are baseline code evidence, not acceptance of this proposed
redesign. All scenarios below are **Not Run**; browser/device execution is blocked
in the current audit environment. Record actual build, browser version, device,
input source, steps, result, and evidence when executing.

### Proposed release matrix

| Environment | Required representative coverage | Input and special checks | Current status |
| --- | --- | --- | --- |
| Narrow compact | 320×568 CSS-pixel emulation for reflow, plus typical 360/390px portrait; short landscape around 667×375. | Touch emulation is layout evidence only; keyboard entry, overflow, sticky chrome, and panels. | Not Run |
| Real iOS phone | A supported iPhone/Safari combination, version recorded. | Real microphone, permission deny/ignore/allow, audio unlock, headphones/speaker bleed, rotation, background/resume, safe areas. | Not Run |
| Real Android phone | A supported Android/Chrome combination, version recorded. | Same physical-input/lifecycle tests; different screen size and performance class where available. | Not Run |
| Medium/tablet | 768px and 1024px widths, portrait/landscape; real tablet if included in launch support. | Touch, optional keyboard, setup panel, lane/graph layout, preserved state. | Not Run |
| Wide desktop | 1280×720 and 1440×900 in supported Chrome/Edge, Safari on macOS, and Firefox; exact versions recorded. | Mouse, keyboard-only, real microphone, short viewport, zoom, graph resize. | Not Run |
| Accessibility | VoiceOver/Safari on a supported Apple device and a supported Windows screen-reader/browser pairing, exact versions recorded. | Navigation, forms, state/feedback, focus restoration, alternatives; distinguish inherently auditory tasks. | Not Run |
| Motion/zoom/performance | Reduced motion; 200% text, 400% zoom/reflow; 30/60/120-or-144Hz where available; baseline phone and desktop profiles. | No lost controls, hidden focus, false lock, excess idle work, or claimed timing without measurements. | Not Run |

This is a proposed test/support scope, not an assertion that every named browser
already works. Select concrete release devices/versions before execution and
publish the actual verified set and known exclusions.

### Capability parity checklist

For each environment, check all five modes; every shared setting; Notes exact
octave/auto-next/references/mastery; Interval directions/fixed-root/presets/chips/
anchors; Chord playback/inversion/presets/chips/isolators; all eight harmony
challenges; all four progressions and four lanes; all tuner modes/tolerances/queue
controls; real mic and preview; C2–C6 answer/audition access; progress/reset/save
recovery; and Stop/volume/mute. Mark where controls moved, rather than interpreting
a collapsed advanced panel as deleted scope.

### Scenario catalog

**Common preconditions:** Record the implementation build under test; start with
a clean profile unless a scenario specifies saved state. Execute core interactions
at compact and wide sizes; add medium and real devices per the matrix. Expected
results below refer to the **proposed** criteria, not claims about current behavior.

| UAT ID | Criteria / ticket | Steps and expected observable result | Input / status |
| --- | --- | --- | --- |
| U-01 | UX-01.A/B; PPS-04 | At 320px and wide desktop, open app with defaults; identify current mode, reach each other mode once, return to Notes, start a note without setup. All modes remain visible/reachable and one primary action leads the flow. | Pointer/touch/keyboard; Not Run |
| U-02 | UX-01.C, UX-08.D/E; PPS-04/09 | At 320px, 200% text, 400% zoom, and short landscape, traverse every panel and open Setup/keyboard/help. No page clipping, hidden focus, covered result, or lost action; any piano scrolling is local with an equivalent answer path. Measure target bounds/spacing and contrast. | Browser, device, measurement; Not Run |
| U-03 | UX-01.D, UX-03.C; PPS-01/04 | Correct a Notes round with auto-next; immediately switch modes, Skip, or Apply a relevant setup change in separate runs. Wait beyond prior timer. No stale new round/audio/score appears, and the destination is announced. | Browser playback; Not Run |
| U-04 | UX-02.A/B, UX-08.B; PPS-05/09 | Change instrument/range/key/scale/notation/tuning and relevant mode controls in Setup. Cancel once and Apply once. Cancel preserves old values/round; behavior-changing Apply commits once and returns Ready without playback/capture; notation-only preserves identity. Focus restores and all advanced controls remain reachable. | Native forms, keyboard; Not Run |
| U-05 | UX-02.C/D; PPS-05 | Enter invalid/out-of-bounds tuning; edit manual endpoints; attempt an impossible pool; change only notation mid-queue. Fields match accepted values, range says Custom, incompatibility is recoverable, notation preserves round/queue. | Form/state; Not Run |
| U-06 | UX-03.A/B; PPS-01 | Start, replay, wrong-answer, retry, correct, and Next in Notes/Intervals/Chords. From Ready explicitly choose harmonic/melodic/arpeggio actions, including descending intervals. Playback matches labels, replay retains target, each success credits once. | Audible browser plus deterministic fixture; Not Run |
| U-07 | UX-03.D, UX-09.D/E; PPS-01/02 | In quality+inversion mode select quality then inversion, Check, retry, and Next. New selections reset; both criteria are explicit. Verify supported seventh inversions and symmetric-quality policy with equivalent voicings. | Musical fixtures and listening; Not Run |
| U-08 | UX-04.A/B; PPS-06 | Exact-octave Notes: omit octave, submit wrong octave, submit correct octave. Missing octave does not grade; wrong octave is rejected; correct accepted. Compare Audition and Answer modes; only explicit Answer/Check grades, without first auditioning the guess. | Native controls and piano; Not Run |
| U-09 | UX-04.C/D, UX-08.A/D; PPS-06/09 | On phone, access C2 and C6 with octave navigation; submit nearby exact-octave answers; repeat with keyboard and assistive technology via equivalent controls. No 49-key squeeze or keyboard trap; action consequence is named. | Touch, keyboard, AT; Not Run |
| U-10 | UX-05.A; PPS-03 | Use a fresh browser/audio policy state; trigger Play. Simulate/resume an interrupted or rejected AudioContext where feasible. Audio starts after intentional action or a visible recoverable failure appears; no false Listening state. | Real audio browser; Not Run |
| U-11 | UX-05.B/C; PPS-03 | From Harmony and Tuner separately: request mic, ignore permission, Cancel, then allow a late resolution; retry. Waiting is visible at origin; cancelled late streams stop; no duplicate capture remains. | Actual permission flow; Not Run |
| U-12 | UX-05.B/E; PPS-03 | Deny microphone permission, remove device/unavailable input, retry after recovery, and inspect both layouts/modes. Each state explains the next useful action in the visible flow; no hidden Mic-only error. | Hardware/permission; Not Run |
| U-13 | UX-05.D/F; PPS-03 | Start mic/backing/progression, vary output volume/mute, then Stop All: all capture/output/callbacks stop. Separately switch Harmony↔Tuner: only the shared capture may remain, visibly indicated, with holds reset and outgoing playback cancelled. Move to a quiz: capture also stops. Page hide, external track end, and post-capture initialization failure clean up correctly; output mute never implies capture Stop. | Browser + lifecycle fixtures + hardware; Not Run |
| U-14 | UX-05.E, UX-13.C; PPS-03/14 | With headphones and speakers in separate runs, play target/cue/preview while capture exists. Verify playback exclusion resets/blocks earned hold until reference ends. Preview/skip never earns points or results; speaker behavior is recorded, not assumed. | Actual acoustic environment; Not Run |
| U-15 | UX-06.A; PPS-07 | Enter Free Tuner, sing/play multiple notes and octaves. Show nearest-note error and following history; no active target task, queue advancement, or earned lock. | Real voice/instrument; Not Run |
| U-16 | UX-06.B/C; PPS-07 | Target C4: produce C4, C5, slightly flat/sharp C4, silence, Stop, and unusable/noisy input. Meter/text agree on target error, octave mismatch is clear, stale readings clear, and recovery copy is useful. | Real input + controlled fixture; Not Run |
| U-17 | UX-06.C, UX-12.C; PPS-07/11 | Hold a target <1.5s then break it; hold continuously ≥1.5s; repeat at supported refresh rates, ordinary jitter, hidden document, resize/rotation. Only continuous eligible visible input locks once per target; interruption cannot piece attempts together. | Synthetic timing plus actual device; Not Run |
| U-18 | UX-06.D, UX-08.C; PPS-07/09 | Resize history on compact/wide/high-density screens; vary cadence and read its text alternative. Same labeled time window, legible graph, consistent tolerance/target, and useful summary; no per-frame announcement spam. | Browser/AT; Not Run |
| U-19 | UX-07.A/B, UX-09.B; PPS-08/02 | In each of eight challenges, hear backing, cue, change key/root, and attempt a hold. Backing/target/sung pitch remain distinct; displayed tolerance equals grading; transposition and reset follow the declared rule. | Music fixtures + real singing; Not Run |
| U-20 | UX-07.C/D, UX-09.F; PPS-08/02 | Before first playback, audition each SATB lane and compare displayed pitch; then play every progression, mute a lane, replay, and Stop mid-sequence. Auditions/labels/notes match; step is visible; rapid replay never stacks. | Audible fixtures/browser; Not Run |
| U-21 | UX-08.A/B; PPS-09 | Complete all non-inherently-auditory control paths keyboard-only, including chips, queue, disabled answers, navigation, and Setup dismissal. Selected/pressed/disabled semantics match behavior; focus is visible and restored. | Keyboard + AT; Not Run |
| U-22 | UX-08.C/F; PPS-09 | Turn on reduced motion and test with sound off. Read task/result/status and progress through AT; control and result meaning survive without glow, movement, or sound; announcements are meaningful and restrained. | Reduced motion/sound off/AT; Not Run |
| U-23 | UX-09.A/B/C; PPS-02 | Generate many/fixed-boundary Notes/Intervals/Harmony/Drill targets for C3–C5, one octave, and a 4-semitone range in non-C key. Targets obey declared constraints or explain incompatibility; accompaniment exceptions are labeled; no C4 fallback contradiction. | Deterministic fixture + UI; Not Run |
| U-24 | UX-09.E/F; PPS-02 | Compare identical augmented voicings from different roots/inversions and review selected symmetric qualities, scale spellings, progression fixtures, and detector endpoints at A4=430/440/448, including C2 below 65Hz at A4=430. Grading follows the documented fair policy; labels and declared detection range match reviewed content. | Music fixtures + real boundary input; Not Run |
| U-25 | UX-10.A/B; PPS-10 | Mix correct/wrong quiz guesses, retries, mic successes, skips, and previews. Inspect per-mode/session/history labels and sample sizes. Quiz accuracy excludes unlike vocal denominators; no uncollected historical breakdown is shown. | Controlled scoring actions; Not Run |
| U-26 | UX-10.C/D; PPS-10 | Reload valid legacy data and new preferences; test malformed counters/cells/JSON and denied storage; reset then cancel/confirm or undo. Scores survive valid migration, invalid data recovers, save failure is truthful, and capture/output reload off. | Seeded storage + browser; Not Run |
| U-27 | UX-11.A/B/C; PPS-13 | With novice learner, skip or choose each goal, reopen help mid-round, and explain cents/inversion/solfège and reference behavior. Mode recommendation is clear; setup remains editable; help preserves round; generic anchors are not described as recordings. | Usability session; Not Run |
| U-28 | UX-12.A/B/C; PPS-11 | Profile idle, active mic, hidden panel, Stop, rapid navigation, and repeated open/close on chosen phone/desktop. Record main-thread/render/detector costs and loop cleanup; no unsupported speedup claim or silent timer accumulation. | Performance tools + hardware; Not Run |
| U-29 | UX-13.A/B/C; PPS-14 | Choose finite practice, complete/retry/skip, pause/finish, review, and switch to free exploration. Counts reflect actual actions, preview is excluded, next action is clear, and playful copy never replaces literal controls. | Browser + learner feedback; Not Run |
| U-30 | UX-14.A/B/C; PPS-12 | Execute full parity checklist/device matrix and representative learner tasks; log actual build/results/evidence and gaps. Readiness report distinguishes passed, failed, blocked, unrun, observed usability, and approval. | Release review; Not Run |

### Requirement-to-ticket-to-UAT coverage

| Proposed requirement | Criteria | Proposed ticket | UAT coverage |
| --- | --- | --- | --- |
| UX-01 | A–D | PPS-04, lifecycle support PPS-01 | U-01, U-02, U-03 |
| UX-02 | A–D | PPS-05 | U-04, U-05 |
| UX-03 | A–D | PPS-01 | U-03, U-06, U-07 |
| UX-04 | A–D | PPS-06 | U-08, U-09 |
| UX-05 | A–F | PPS-03 | U-10, U-11, U-12, U-13, U-14 |
| UX-06 | A–D | PPS-07 | U-15, U-16, U-17, U-18 |
| UX-07 | A–D | PPS-08 | U-19, U-20 |
| UX-08 | A–F | PPS-09 | U-02, U-09, U-18, U-21, U-22 |
| UX-09 | A–F | PPS-02 | U-07, U-19, U-20, U-23, U-24 |
| UX-10 | A–D | PPS-10 | U-25, U-26 |
| UX-11 | A–C | PPS-13 | U-27 |
| UX-12 | A–C | PPS-11 | U-17, U-28 |
| UX-13 | A–C | PPS-14 | U-14, U-29 |
| UX-14 | A–C | PPS-12 | U-30, all relevant matrix results |

## 7. Research, decisions, and acceptance readiness

### Focused validation plan

Recruit a small mix of self-directed beginners, singers, and experienced learners
who match the intended audience. Initial candidate tasks: start a default Notes
round; adjust range; complete an exact-octave answer; identify a descending
interval; submit quality+inversion; recover from a mic denial; hear backing and
sing a harmony; find Stop; return to a prior setup. Observe compact and desktop
paths instead of asking whether the design “looks intuitive.” Record where users
hesitate, misunderstand, need help, or abandon; report the sample's limitations.

Proposed measurement definitions, not current analytics or promised results:

- **First-round completion:** eligible new-user sessions completing one real
  scored round / eligible new-user sessions that start one, within the chosen
  observation window. Keep preview-only sessions separate.
- **Independent task success:** participants completing each specified task
  without moderator help / participants attempting it; report time and errors
  alongside the denominator and device.
- **Permission recovery:** users reaching a usable recovered mic state /
  users attempting recovery after a specific error, with the error category
  and observation window recorded.
- **Guardrails:** no false preview credit; no hidden active capture; no loss of
  saved valid scores; no mode/advanced-control parity regression; no keyboard or
  reflow blocker. Performance budgets are set from PPS-11 measurements.

Do not add production telemetry or collect recordings merely to write this spec.
Use authorized research/data collection with a clear purpose if later requested.

### Outstanding decisions

| Decision | Recommended working direction | Required resolution |
| --- | --- | --- |
| D-01: Range and scale scope | UX-09 distinguishes learner targets from accompaniment and states interval/chord exceptions. | Confirm musical examples and incompatibility copy before generation changes. |
| D-02: Symmetric chord inversions | Provide root context or exclude ambiguous qualities from inversion grading; equivalent interpretations are another valid design. | Select one fair policy and fixture set; do not ship arbitrary hidden-root grading. |
| D-03: Seventh inversions | Support all four only when product scope includes a complete inversion exercise; otherwise label the subset. | Choose explicit scope before PPS-01/02 acceptance. |
| D-04: Legacy progress | Keep existing aggregate scores as Legacy and collect new per-mode data prospectively. | Define versioned schema/migration and reset behavior without fabricating breakdowns. |
| D-05: Repeated sustained targets | Default to a clear target transition; decide whether a new onset/release is needed for earned repeated-note credit. | Validate with singers and accessibility needs; document scoring rule before session acceptance. |
| D-06: Launch support | Proposed device matrix above. | Assign real versions/devices and execute; no support promise before evidence. |
| D-07: Personality | Friendly rehearsal-room voice with literal task controls, restrained musical accents. | UI Engineer develops visual direction within the existing brand/style constraints. |

### Handoff to UI Engineer

Begin with PPS-01…05 and the layout contract, using baseline `B-*` capabilities
as the preservation inventory and `UX-*` criteria as the proposed behavior spec.
Use the agreed React, strict TypeScript, Vite, Tailwind CSS, shadcn/ui, and Motion
target stack in the revised [technical design](technical-design.md). Keep pure
music rules and browser audio services independent of React rendering. Extract
tokens and reusable layout/control/state patterns as implementation warrants
them. The running vanilla prototype remains the audited baseline until that
implementation is performed. Maintain criterion/ticket identifiers in the
handoff and verification report; update this spec when a material decision changes.

The audit is complete enough to guide scoped implementation. Readiness to
release is **not established**: proposed changes are unimplemented, browser and
hardware scenarios are Not Run, and the decisions above remain to be resolved
through implementation planning and targeted validation. This is a concrete
reviewable plan, not an approval requirement imposed on the user.
