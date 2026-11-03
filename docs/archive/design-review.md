> Historical planning document. The standalone prototype and design preview have been retired.
> See the [current README](../../README.md) and [architecture](../architecture.md) for the maintained app.

# Pitch Perfect Studio — product review of the design proposal

**Review revision:** 1.1, 2026-11-03.\
**Role:** Music Product Manager, reviewing the saved artifacts against the product spec.\
**Current disposition:** Recommend proceeding to scoped implementation of the agreed architecture and detailed Notes/Tuner/shared-shell patterns. All five core preview findings are reconciled in the corrected source; browser evidence remains limited to the specific observations recorded below. This is not stakeholder approval or production acceptance.

## 1. Scope and evidence

Reviewed [technical design revision 1.1](technical-design.md),
`interactive design preview` (retired prototype), and
[design-system/component guide revision 1.1](design-system.md), against the
[current product baseline](product-spec.md) and all **58 acceptance criteria** in
the [UI/UX improvement plan](ux-improvement-plan.md).

The user-agreed target stack is **React, strict TypeScript, Vite, Tailwind CSS,
shadcn/ui, and Motion**. That technology choice is settled for the next
implementation phase. The running prototype remains the baseline vanilla app;
the standalone HTML preview is a review artifact, not a partial React migration.

This design phase intentionally details **Notes, Tuner, the shared responsive
shell, Setup, and nearby exact-octave/piano interaction**. Intervals, Chords, and
Harmony are labeled preserved-feature outlines, supported by the TDD and
component map. Their full screen/state design and production behavior remain
future work. A placeholder is acceptable for this phase; it is not acceptance
of that mode's eventual feature parity.

| Evidence | What it establishes | Limits |
| --- | --- | --- |
| Saved artifact source/content review | State intent, control presence, labels, responsive rules, component ownership, scope declarations, and technical traceability. | Does not establish final rendering, audio behavior, real-device usability, or correctness of unimplemented services. |
| Six opaque token-pair contrast calculations recorded in the design guide | Paper/Ink, Paper/Panel, Muted/Ink, Muted/Panel, Ink/Lime, and Ink/Lilac calculations are strong starting pairs. | Not a full rendered contrast, focus, opacity, disabled-state, chart, or accessibility audit. |
| Recorded native Brave preview inspection | Local file loaded and Notes rendered; Phone produced a 390-CSS-pixel inner viewport; five bottom destinations were visible; no obvious horizontal clipping in those viewed Notes states. | Separate from PM source review; not native touch/device proof, zoom testing, or a full layout matrix pass. |
| Recorded short-viewport inspection | At roughly 390×545 inner CSS pixels, large heading/decorative listening stage pushed answers/feedback below the fold in Ready/Awaiting Answer. | A concrete hierarchy issue to address, not a finding about every phone or a complete usability study. |
| Recorded pre-correction Tuner interaction check | Preview flow reached Waiting then Simulated Input without a real permission prompt; in-modal Stop changed it to Off and Cancel returned to Off with focus restored to Setup. Free Tuner removed target/hold/queue/Next from the accessibility tree. | This confirms those illustrative prototype paths in the previously loaded file, not production resource cleanup, real capture, all focus paths, or the corrected revision's full behavior. |
| Corrected wide-preview inspection | After reloading the corrected file and selecting Desktop, the accessibility tree included the context rail and “1320px canvas · 87% display”; a recorded screenshot showed the wide rail composition. | This is a fit-to-screen desktop design canvas, not native phone testing, a full viewport matrix, or rendered accessibility certification. |
| Corrected phone-preview accessibility inspection | Phone reported 390px; after Play, the fresh accessibility tree exposed Replay, all twelve note-answer controls, and C Major/C3–C5 context. The decorative category/extra intro were no longer exposed in that active state. | Later screenshots remained on a stale Ready image, so revised phone pixel placement was not reliably confirmed. Accessibility-tree presence does not prove controls are within the visible viewport. |

The final browser session subsequently lost its frame/window during Setup
attempts (`elementHasNoFrame` / `noWindowsAvailable`). The revised output,
notation, tolerance, and added Tuner-state interactions were therefore reconciled
by source inspection, not falsely recorded as browser-passed. Their final
rendered/interaction and device checks remain validation work during implementation.

No learner interviews, hardware microphone tests, production React component
tests, device-support certification, performance profiling, or formal UAT were
conducted as part of this review. U-01…U-30 remain **Not Run** for production.

## 2. Product assessment

The proposal gives the app a recognizable musical character while keeping task
controls literal. Warm ink, lime/lilac accents, editorial headings, tactile note
answers, and restrained feedback support the rehearsal-room direction. The
strongest changes are functional: short mode names, practice-first composition,
transactional Setup, nearby exact-octave entry, explicit Audition/Answer behavior,
separate Free/Target tuner presentation, and visible simulated-input status.

The core architecture supports those flows: one responsive component tree, one
shared state/controller, explicit non-React owners for audio/capture/timing,
typed domain rules, scoped live-pitch updates, and a one-writer progress schema.
These are concrete implementation contracts, not evidence they have been built.

The scope is honest. The preview does not request a microphone, play audio,
persist data, or award scores. Authored trails and pitch readings are called
illustrative; success copy never claims real performance. The empty progress
state avoids fabricated history or misleading sample KPIs.

### Design findings and correction record

These are source/preview findings within the detailed core scenes. They are
separate from future implementation work such as real capture races or full
Chord/Harmony screens. Each corrected-source disposition follows inspection of
the saved revision, not merely a request to fix. It does not imply a complete
browser/device verification pass.

| ID | Finding and affected criteria | Resolution / corrected-source evidence | Current disposition |
| --- | --- | --- | --- |
| DR-01 | Output volume/mute existed only in the wide Notes context rail, hidden below 1200px and absent from Tuner. UX-05.F requires it on both layouts. | Shared immediate Output section now appears first in the one Setup dialog, reachable in every mode/width. `renderOutput` synchronizes values/mute; Apply/Cancel do not overwrite it or change input state. | Corrected in source; browser execution coverage is recorded separately. |
| DR-02 | Setup stored the notation choice, but the preview's note rendering did not consume it. A visible editable label preference appeared ineffective. UX-02.A/D. | `pitchClassLabel`/`displayPitch` now feed answer labels, exact-note options, Tuner, and queue. Notation-only Apply preserves question/target/input state; scientific spelling remains context. | Corrected in source; browser execution coverage is recorded separately. |
| DR-03 | Target tolerance changed in Setup, while the meter's in-tolerance band remained fixed to the standard setting. Compact task context omitted tolerance and the active range; Notes showed key/scale but not range. UX-06.B and UX-02.A. | Band now uses left `50−tolerance` and width `2×tolerance`; visible tolerance text and key/practice range update from state. Free Tuner presents ungraded chromatic guidance and A4 instead of implying a practice-range detection limit. | Corrected in source; browser execution coverage is recorded separately. |
| DR-04 | Tuner examples omitted concrete silent/unusable, interrupted, and octave-mismatch states, although these address central baseline problems. UX-05.B and UX-06.B/C. | All three authored states are now selectable. Silence/interruption show a dash and zero hold. Mismatch shows nearest C5 at 0¢ versus C4 at +1200¢, illustrative frequency, no hold, and beyond-meter text; its authored history jumps above the plot with a matching clamped/above-range accessible description. | Corrected in source; actual microphone behavior remains unimplemented/unverified. |
| DR-05 | Recorded browser inspection found that mobile heading/decorative listening stage dominated the short viewport after playback; answering needed excessive scrolling. The Tuner Off state similarly placed Start below a large empty reading. UX-01.B/C. | Compact active Notes now hides the decorative waveform/extra intro, uses a small Replay row and two-row answer grid. Empty Tuner orders input actions before the empty reading. Desktop has a real 1320px inner canvas with fit-to-outer scaling and a width/scale label. | Corrected in source. Wide rail/1320px canvas confirmed in recorded browser inspection; revised phone structure confirmed through fresh AX, with pixel placement still unverified because screenshots became stale. |

Do not read this list as a request to implement the whole application now. It
closes the most consequential inconsistencies in the design artifact before its
patterns are carried into production.

## 3. Acceptance-criterion review coverage

The table explicitly covers all 58 criteria. **Represented** means the design
or source gives useful evidence for the intended interaction; **Specified**
means the TDD defines the contract; **Deferred** means this phase intentionally
does not implement or fully depict it. None of these labels is a production UAT
Pass. Findings DR-01…DR-05 and their evidence/dispositions are recorded above.

| Criteria | Design evidence and PM assessment | Remaining implementation / acceptance |
| --- | --- | --- |
| UX-01.A, UX-01.B | Five short named destinations, Notes task hierarchy, real headings, and illustrative primary action are represented. Intervals/Chords/Harmony identify their outline status. DR-05's source corrections compact repeated phone practice and put the empty Tuner action first. | Execute U-01 after production composition; verify all modes are actually functional and understandable. |
| UX-01.C | Compact/medium/wide CSS, single-column narrow practice, optional local keyboard, measured chrome reservation, and isolated inner preview width are represented. Corrected review controls provide a real 1320px canvas with a declared display scale. | U-02: actual 320px, zoom/text, orientation, safe-area, software keyboard, clipping, and focus visibility. |
| UX-01.D | Preview `changeMode` preserves setup, stops outgoing example actions, and retains illustrative capture only Harmony↔Tuner. TDD mode/round ownership is explicit. | U-03: real output/continuation cancellation, destination focus/announcement, and no stale grading. |
| UX-02.A | Shared global fields and Notes/Tuner settings are represented; other mode controls are representative outlines. TDD's full persisted-settings/vocabulary inventory preserves the advanced scope. DR-01/DR-02/DR-03 affect detailed control consistency. | U-04 and parity checklist: preserve every baseline setting/preset/filter, not only controls currently shown in the mock. |
| UX-02.B | Native modal, Apply/Cancel, explicit Ready-on-behavior-change, no automatic playback, and in-modal Stop are represented; TDD defines draft/resource transaction. | U-04: actual dialog containment/restoration, paused eligibility, invalidation, and Cancel never undoing Stop. |
| UX-02.C | Custom range and tuning/span validation are represented. Complete exercise incompatibility handling is specified in TD-04 rather than fully simulated. | U-05/U-23: field errors, impossible candidate sets, normalized values, and no hidden C4 fallback. |
| UX-02.D | Example identity is retained for notation-only Apply; TDD's settings-impact table separates presentation and behavior changes. Corrected notation rendering now makes the preference visibly effective. | U-05: preserve real question/queue/earned counters and actual resources, not a stale resource snapshot. |
| UX-03.A, UX-03.B | Notes Ready/Awaiting Answer/Retry/Correct and replay/next intent are represented. No audio is played, so real Playing/callback transitions are specified in TD-03. Interval/Chord detailed playback screens are deferred. | U-06: physical playback and initiating variants from Ready, including descending/harmonic/arpeggio behavior. |
| UX-03.C | Preview prevents reopening a completed example for grading and labels optional auto-advance as intentionally unscheduled. TDD specifies one-credit/idempotency/timer guards. | U-03/U-06: real duplicate input, stale callbacks, Replay/Skip/setup ordering, optional continuation timing. |
| UX-03.D | Chords outline and component map call for explicit quality plus inversion then Check Answer; TDD defines cleared drafts and named-root context. | Full Chord screen design and U-07 are deferred; no claim that outline controls complete this flow. |
| UX-04.A, UX-04.B | Nearby note/octave selectors and Check Answer, missing-input feedback, optional piano, and explicit Audition/Answer labels are represented. Preview never plays or scores. | U-08: actual complete-input grading, wrong-octave rejection, no audition-before-answer, and equivalent consequences across input methods. |
| UX-04.C, UX-04.D | Octave windows 2–5 include C2…C6 access; native fields remain the full alternative to spatial keys. Native named buttons make the proposal reviewable. | U-09: composed piano focus/navigation, all pitch bounds, touch and AT behavior. Preferred 44px sizing needs final measurement for small standalone octave controls. |
| UX-05.A | Preview explicitly avoids audio/capture APIs; TDD starts context preparation from user intent and reports resume failures. | U-10: actual browser audio-policy/gesture and interrupted context behavior. |
| UX-05.B, UX-05.C | Simulated Off/Waiting/Denied/Input/Lock, Cancel/Retry, shared indicator, and in-modal Stop are represented. DR-04 fills missing silent/interrupted states. TDD's request leases address unanswered/late permissions. | U-11/U-12: real ignored/denied/device errors and late stream cleanup; preview timeout is illustrative, not an API guarantee. |
| UX-05.D | Shared Stop, Setup preserving actual stop state, and Harmony↔Tuner retention policy are represented/specified. | U-13: real capture/output/timers cleanup, track ending, page hide, initialization failure, and no cross-mode hold credit. |
| UX-05.E | Headphone guidance, explicit simulation labels, and separate reference actions are represented; TDD specifies reference/preview exclusion and local processing. | U-12/U-14: actual permission recovery, acoustic environments, exclusion windows, and honest privacy/capture status. |
| UX-05.F | Corrected shared immediate Output section in Setup addresses the initial wide-rail-only gap. TDD separates master gain/mute from capture and draft configuration. | U-13: true output level/mute, cross-layout availability, no accidental capture implication or Cancel rollback. |
| UX-06.A | Free mode removes target task/hold/queue/Next and names nearest-note tuning; authored readings/history remain clearly simulated. | U-15: graph/readout must follow actual detected pitch, not a hidden target. |
| UX-06.B | Corrected target band/readout use selected tolerance; the authored octave-error state separates nearest-note error from +1200¢ target error with matching beyond-range history description. | U-16: actual target-relative values, clamp/beyond-range indication, and octave errors. |
| UX-06.C | Off/Denied/Waiting and the new silent/unusable/interrupted states clear the example pitch; authored lock is unearned. TDD defines continuous eligible hold and repeated-target rearm. | U-16/U-17: real stale-readout clearing, timing/reset, low input, and once-only completion. |
| UX-06.D | Fixed “last 8 seconds” authored chart, independent readable HTML pitch labels, and text/ARIA summary are represented. | U-18: real timestamp history, meaningful alternative, scaling/DPR/resize and announcement behavior. |
| UX-07.A, UX-07.B | Harmony outline preserves eight challenges and backing/target/sung distinction; TD-04/07 specify tonic/range/tolerance. | Full Harmony target screen/state design and U-19 are deferred; D-01 remains a working policy. |
| UX-07.C, UX-07.D | Mixer outline preserves four progressions and SATB lanes with Audition Voice, Mute/You Sing, playhead, and Stop; TDD assigns content/scheduler ownership. | Full Mixer screen design, initial audition/content corrections, and U-20 are deferred. |
| UX-08.A, UX-08.B | Native buttons/selects/disabled answers, selected pressed-state navigation, real headings, and one native modal are represented. TDD chooses controlled accessible Tabs and a single Radix-backed Dialog for production. | U-09/U-21: keyboard/AT, focus restoration, disabled controls, full tab relationships, and hidden content. Native preview semantics are not production shadcn verification. |
| UX-08.C | Text feedback, limited status regions, example meter label, named progress value, and chart alternative are represented. | U-18/U-22: avoid duplicate announcements between task feedback and shared announcer; do not announce raw pitch frames. |
| UX-08.D, UX-08.E | Useful control geometry, measured chrome reservation, focus outline, and six token contrast pairs are documented. Some standalone compact controls initially use <44px preferred targets; measure/adapt final components. | U-02/U-09: all rendered text/controls/focus/opacity states, target spacing, 200% text/400% zoom. No complete conformance claim. |
| UX-08.F | Reduced-motion CSS, static decorative waveform, literal controls, and text status are represented; TDD adopts user motion preference and avoids animation-controlled grading. | U-22: final sound-off/reduced-motion/AT workflows on actual component implementation. |
| UX-09.A, UX-09.B, UX-09.C | Preview exposes selected range/key/scale; TD-04 gives bounded candidate enumeration and stated target/backing scope, tonic walk/arpeggio rules, and recoverable incompatibilities. | U-19/U-23: actual generation fixtures, narrow ranges, non-C keys, explicit arpeggio quality, accompaniment labels, and D-01 adoption. |
| UX-09.D, UX-09.E | TDD recommends all tone-count inversions with visible/auditionable reference root, covering both augmented symmetry and sus2/sus4 cross-quality aliases. | U-07/U-24: actual screen choices, accepted D-02/D-03 policy, and fair musical fixtures. |
| UX-09.F | TDD retains complete vocabulary/progression inventory and plans reviewed music fixtures plus tuned detector bounds. | U-20/U-24: actual corrected content, sample rates, C2 at A4=430/440/448, and real timbre/noise/device evidence. |
| UX-10.A, UX-10.B | Empty progress is honest; no fabricated example score or claimed saved mastery. TD-09 defines Legacy vs new quiz/vocal counters and denominators. | U-25: actual sample sizes, history/session naming, first-try semantics, and mixed-mode calculations. |
| UX-10.C, UX-10.D | No preview storage APIs; component map/TDD specify validated v2 migration, preserved v1, local save recovery, and reset confirmation. | U-26: migration/reset failure paths, late callbacks, concurrent tabs, no old-history resurrection, and startup input/output Off. |
| UX-11.A, UX-11.B, UX-11.C | Contextual musical guidance is represented, with optional Learn disclosure and literal references; TD-10 specifies skippable goal-led onboarding. | U-27: full first-use design/copy and real learner comprehension remain deferred PPS-13 work. |
| UX-12.A | Preview has no idle audio/pitch processing loop; TDD specifies active-only analysis/display and scoped React subscriptions. | U-28: real detector/render lifecycle, HMR/StrictMode/remount cleanup, hidden work, and no duplicate runtime owners. |
| UX-12.B | TDD names profiling work and requires evidence before numerical budgets or speed claims. | U-28: device/browser baseline and before/after measurements; no performance acceptance from HTML or architecture alone. |
| UX-12.C | TDD separates monotonic observation timing from React/frame animation and preserves owners through responsive resize. | U-17/U-28: real jitter, hidden state, resize, orientation, audio continuity, and actual sample-rate behavior. |
| UX-13.A, UX-13.B, UX-13.C | Free practice and encouraging literal-language feedback are represented; previews explicitly never earn XP. TD-10 specifies optional finite sessions and ungraded tools. | U-14/U-29: finite-session screen/review, real outcomes, pause/finish, and preview/skip exclusion are deferred PPS-14 work. |
| UX-14.A, UX-14.B, UX-14.C | Proposed matrix, complete capability inventory, and research task definitions remain linked; design scope does not pretend outlines are full feature parity. | U-30 plus all relevant matrix results and learner evidence remain unexecuted; no inferred browser support or usability validation. |

## 4. Reuse and extensibility assessment

The component plan appropriately uses shadcn/Radix foundations for Buttons,
Dialog, Tabs, Fields, Select/Checkbox/Switch, Progress, disclosure, and reset
confirmation. It reserves custom work for musical semantics and geometry:
note-answer composition, octave piano, pitch meter/history, queue, harmony lanes,
and the real-time resource model. Tailwind consumes shared semantic tokens;
Motion provides purposeful presentation transitions without owning score clocks.

Recommended implementation discipline:

- Choose the one primitive provider/preset described by the TDD and one responsive
  Dialog. Do not create separate mobile/desktop state trees or modal resource owners.
- Keep reusable visual variants small. Do not turn the illustrative file tree
  into a requirement for dozens of abstractions before the first feature works.
- Port the 13 baseline behavioral expectations into typed direct-import tests,
  then add the specified component/resource-race tests. Passing old source-VM
  tests alone does not verify the new runtime.
- Carry advanced controls from the audited inventory into later mode designs:
  interval presets/directions/anchors, quality/inversion filters and isolates,
  eight harmony challenges, four progressions/four voices, and all tuner drills.
  Their absence from a detailed mock is deferred work, not permission to drop them.

## 5. Product decisions D-01…D-07

| Decision | PM assessment for this phase | Next evidence / action |
| --- | --- | --- |
| D-01 range/scale | TDD's hard target limits and labeled accompaniment range are coherent. Tonic-only Harmony changes baseline New Root; it is explicit rather than hidden. | Adopt or revise the proposed Change Reference Octave/local-root policy in the feature spec before that implementation; test narrow-range remedies. |
| D-02 ambiguous chords | Displayed/auditionable reference root is a sensible working choice. Including sus2/sus4 cross-quality aliases strengthens the original symmetry finding. | Confirm the training intent and preserve alias fixtures; do not call one hidden interpretation uniquely correct. |
| D-03 seventh inversions | All tone-count inversions are a coherent proposed expansion, not existing functionality. | Implement accurate labels/answer choices and fixtures only with the chosen scope recorded. |
| D-04 Legacy progress | Prospective per-mode counters plus exact Legacy snapshot avoid fabricating history. Reset semantics are unusually detailed and appropriately separate partial persistence failures. | Verify migration/cleanup/reset with fixtures and UI copy; do not expose speculative reconstructed old mode accuracy. |
| D-05 repeated targets | Unique instances, avoiding repeated pitches where feasible, and release/Ready Again are reasonable working choices. | Validate rearm behavior with singers and accessibility needs; the suggested release interval is not research evidence. |
| D-06 launch support | Matrix is a plan, not a support statement. Limited Brave preview observation does not certify iOS, Android, real mic, AT, or 400% zoom. | Select real versions/devices and execute the UAT matrix before publishing support claims. |
| D-07 personality | Warm rehearsal-room direction and literal controls fit the intended product; concrete preview gives it a distinct character. | Close core preview corrections, obtain actual design/user feedback, and retain the distinction between PM recommendation and stakeholder acceptance. |

These decisions need not block unrelated typed scaffolding or pure-domain
extraction. They must be resolved or explicitly scoped before their affected
feature can be accepted. No new permission gate is being imposed.

## 6. Readiness recommendation and next increment

The corrected design is sufficiently concrete to guide the agreed frontend
architecture and a scoped Notes/Tuner implementation. No unresolved design-phase
blocker remains in the reviewed core source. Preserve this review's evidence
limits and the remaining mode
design tasks. It is not a complete five-mode production acceptance report.

Suggested first implementation increment: agreed toolchain and semantic tokens,
typed domain fixtures, one resource boundary/controller, shared shell/Setup, and
Notes with accessible exact-octave input. Add Tuner only through the accepted
capture lifecycle and target-error contract; carry the acceptance IDs into the
PR/test/UAT handoff. Keep production implementation, real-device validation,
learner research, and stakeholder sign-off distinct activities.
