# Architecture

## Frontend refactor working criteria

This structural refactor follows the user's code-quality review. It preserves
existing visuals and musical behavior rather than introducing product changes.

- REF-01: App is a composition entry; shell, Setup, quizzes, piano, vocal practice
  and progress have focused modules with explicit dependencies.
- REF-02: Repeated select/checkbox controls use typed shared primitives;
  primitives retain native semantics, labels, focus behavior and existing styles.
- REF-03: Setup draft editing, validation/presets and per-mode sections are
  separated from dialog composition. Cancel/Apply and immediate output keep
  their current semantics.
- REF-04: Quiz entry state is local to its answer form. Reusable musical
  formatting and preset rules are testable outside JSX; grading stays in domain
  services and runtime.
- REF-05: Live pitch remains subscribed only by its display. Audio/session
  ownership, scoring, persistence and resource cancellation remain outside React.
- REF-06: Existing 118 service/domain tests and 16 browser scenarios keep passing;
  focused tests cover extracted state/formatting contracts. Check responsive
  screenshots and keyboard/dialog behavior against the pre-refactor baseline.

Implemented on the refactor branch: App is a 17-line composition entry; the
Setup dialog is 155 lines and the quiz panel is 117 lines. Local validation:
150 unit/service/hook tests and 20 browser scenarios pass, alongside strict
types, lint, formatting and the production build. The compiled CSS hash is
unchanged. Phone/desktop screenshots were inspected against the baseline;
animated feedback opacity makes immediate-load screenshots non-identical.
Review and merge remain separate from this local verification. Real-device
audio validation is not claimed by this structural change.

## Frontend ownership

- `src/app/`: shell composition, navigation, heading, and error boundary. Studio
  owns the application snapshot subscription and Setup opener focus capture.
- `src/components/ui/`: shared buttons, dialogs, labeled typed native selects,
  and checkbox controls. Native event conversion is implemented once; callers
  receive declared option values rather than casting arbitrary strings.
- `src/components/audio/`: output controls and capture status, with narrow props
  and callbacks to the runtime. Shared option labels live in `practice-options.ts`.
- `src/features/setup/`: dialog composition, independent per-mode settings
  sections, and a transactional draft hook. Pure presets/candidate preparation
  live in `domain/settings-presets.ts`; runtime remains the authoritative validator.
- `src/features/quiz/`: common playback/feedback composition, independent note,
  interval and chord answer forms, shared answer tiles and interval guide.
  Entry preparation and submitted-answer formatting are pure helpers. Forms
  reset at the round identity boundary; retries retain local entries.
- `src/features/piano/`: instrument controls and a pure key-layout/eligibility
  model. Auditions and answer submissions call separate runtime commands.
- `src/features/vocal/`: Harmony target/mixer/help, tuner controls, and pitch
  display. Only PitchDisplay subscribes to live samples; chart and hold UI
  receive derived props. Pitch-history geometry and reading descriptions are
  pure presentation helpers, not grading decisions.
- `src/features/progress/`: summary calculations, reset transaction hook,
  confirmation dialog and progress presentation. Context copy lives separately
  in `features/context/`.
- `src/styles/`: foundation, shell, training, vocal, progress, dialog and
  responsive rules. `styles.css` is an ordered import entry; preserve import
  order because existing responsive/refinement rules intentionally override base rules.

Feature components own transient form state; persistent settings, scores,
capture and playback remain runtime-owned. Do not create a second settings
store inside a control or move resource lifetimes into rendering. ESLint rejects
React/UI imports from domain and service-owner modules.

Pitch Perfect Studio is a static, client-side React application. Vite serves and
builds the app; strict TypeScript, Tailwind CSS, owned Radix-backed UI components
and Motion provide the interface. There is no backend, account system, analytics
or recording upload.

## Boundaries

- `src/domain/`: musical vocabulary, valid exercise generation, exact-answer
  grading, progression fixtures and timestamp-based continuous-hold rules.
- `src/audio.ts`: lazy Web Audio synthesis, cancellable cues/backing, voice mute,
  microphone acquisition/cleanup and pitch detection.
- `src/runtime.ts`: typed controller for exercise lifecycle, asynchronous
  cancellation, scoring, settings and scoped pitch publication.
- `src/store.ts`: immutable external-store snapshots. Live pitch has a separate
  subscription so samples do not cause whole-app renders.
- `src/persistence.ts`: validated local progress, migration and save recovery.
- `src/App.tsx`, `src/app/`, `src/features/`, `src/components/`, `src/styles/`:
  composition, responsive feature UI, shared native controls and styles.
- `tests/`, `e2e/`: domain/service/runtime regressions and Chromium user flows.

Audio services are owned outside React rendering. Audio and microphone access
start only from user actions, and pending acquisitions can be cancelled. Keep
pure music rules separate from UI and resource lifecycle code.

Where the optional Audio Session API exists, intentional playback requests
`playback` mode, including for music playback with the phone's silent switch on.
Capture owns a `play-and-record` lease from preparation through microphone use;
stopping tracks restores playback mode. Cancellation, denial, graph failure and
interruption release the lease too. Late permission results clean up their own
tracks and reassert the mode appropriate to the current owner. Playback cues
must retain recording mode while capture is active. Disposal releases the
session to `auto`. Unsupported or throwing APIs cannot block audio or cleanup.

This handles a documented [WebKit audio-session issue](https://bugs.webkit.org/show_bug.cgi?id=236219)
without increasing gain or recreating the shared AudioContext. Platforms may
still use different physical volume levels/routes while recording. Real-device
silent-switch and start/stop microphone checks remain necessary; mocked API
transitions are not loudness measurements.

## Practice invariants

Skips, reference playback and simulated microphone input never earn scores or
change quiz accuracy. Exact-octave answers must include the octave. Pitch locks
require a continuous timestamp-based hold; silence, drifting or interruptions
reset it. Only the visible eligible mode can accumulate a lock. Harmony target
navigation chooses a different feasible reference when available and does not
award progress. The SATB mixer is ungraded rehearsal.

HelpDialog composes the shared accessible dialog with a labeled trigger,
numbered steps and optional context. It owns only local open state; guidance
does not alter settings or practice state. Keep action controls and actionable
range/permission errors on the practice page.

Use the existing Lucide SVG icon set for interface controls and mode navigation.
Mode icons share a 22px box and 1.75 stroke weight (17px in short landscape
navigation), inherit the active/muted text color, and are decorative beside
visible labels. Do not use Unicode or emoji glyphs as interface icons: their
shape, color and alignment depend on the device font.

## Persistence and privacy

`pitch_perfect_studio_v2` stores preferences and progress in localStorage. Valid
`pitch_perfect_studio_v1` data imports once as a distinct legacy snapshot. Normal
practice leaves v1 untouched; confirmed reset uses a v2 marker before legacy
cleanup. Invalid/newer v2 data is preserved and automatic saving is blocked.

Storage is specific to scheme, hostname and port. A phone, a LAN IP, localhost
and HTTPS each have separate histories. There is no cross-device sync or
cross-origin transfer. Concurrent tabs do not merge progress.

Microphone samples are analyzed in memory on the device. No recordings are
stored or sent. On a phone, trusted HTTPS is required for capture; see the
[network setup](../README.md). Certificates and private keys are local files
excluded from version control.

## Validation limits

Automated tests include synthetic pitch, mocked microphone permissions and
Chromium viewport checks. These do not establish real iOS/Android microphone,
Safari, assistive-technology, audio quality or device performance support.
Guided sessions, accounts, cloud sync, native packaging and PWA installation
remain outside the implemented scope.

Original requirement IDs and proposed acceptance scenarios are retained in
[the archive](archive/README.md); historical UAT plans are not proof of execution.
