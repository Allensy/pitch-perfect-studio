# Architecture

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
- `src/App.tsx`, `src/components/`, `src/styles.css`: responsive practice modes,
  shared Setup, accessible dialogs, instrument keyboard and pitch HUD.
- `tests/`, `e2e/`: domain/service/runtime regressions and Chromium user flows.

Audio services are owned outside React rendering. Audio and microphone access
start only from user actions, and pending acquisitions can be cancelled. Keep
pure music rules separate from UI and resource lifecycle code.

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
