> Historical planning document. The standalone prototype and design preview have been retired.
> See the [current README](../../README.md) and [architecture](../architecture.md) for the maintained app.

# Pitch Perfect Studio visual design and component guide

**Revision:** 1.1, 2026-11-03. Reviewed prototype refinements.\
**Status:** Proposed visual direction and interactive design prototype, before application implementation.\
**Preview:** `Interactive mobile and desktop design` (retired prototype).\
**Inputs:** [Product specification](product-spec.md), [UX requirements](ux-improvement-plan.md), and [technical design](technical-design.md).

## Design direction

**A pocket rehearsal room.** Warm ink surfaces, acid-lime action, a small electric-lilac accent, tactile note keys, and generous editorial type make practice feel musical without filling the screen with effects. The interface gives the current musical task the strongest hierarchy. Setup, learning support, and progress remain nearby but secondary.

The same identity works at phone and desktop sizes. Desktop gains useful context beside the exercise; phone prioritizes listening, answering, and feedback. Personality lives in composition, notation, and short encouraging results such as “Locked in.” Critical controls keep literal names: Play, Replay, Check answer, Next, Stop all, Apply, and Cancel.

This is one concrete direction for review. It is not a claim of user-tested usability or a final brand approval.

## Preview scope and review controls

Open `design-preview.html` directly in a browser; it has no dependencies or network requests. The outside review toolbar is not part of the proposed product UI.

- **Responsive** follows available width. **Phone** constrains the inner viewport to 390px or the available narrower width. **Desktop** creates a true 1320px inner canvas and scales its presentation down when the outer browser is narrower. The review footer reports the canvas width and display scale; responsive behavior still uses the inner width. This makes the wide composition reviewable without requiring a 1320px browser window.
- The product lives in an isolated preview iframe. Responsive rules and the native Setup dialog therefore follow the actual inner width, including when Phone is selected in a wide desktop browser.
- **Example state** selects Notes Ready, Awaiting answer, Try again, or Correct; Tuner Off, Awaiting permission, Simulated input, Permission denied, Simulated lock, Silent/unusable, Interrupted input, or Octave mismatch. Free Tuner excludes target-lock and target-octave-mismatch examples. Values are illustrations, not measurements.
- Notes and Tuner are the detailed interactive scenes. Intervals, Chords, and Harmony have clearly marked preserved-feature outlines, with their planned capabilities and representative Setup controls. They are not completed screen implementations.
- No real sound, microphone request, score, analytics, or browser storage is used. The pitch trail is authored example data. The prototype does not establish any production acceptance result.

## Palette and semantic tokens

Use the semantic meaning consistently across Tailwind theme tokens and the selected shadcn components. The prototype prefixes its variables with `--pp-`; production maps these values to the application's shared theme. Avoid styling each component with an unrelated palette.

| Token / semantic role | Value | Use |
| --- | --- | --- |
| Ink / background | `#161714` | Main application surface; primary-button foreground. |
| Panel / card / popover | `#22251F` | Exercise well, Setup, focused secondary surfaces. |
| Raised / secondary | `#2C3027` | Selected secondary controls and the active-input strip. |
| Line / border | `#494E42` | Boundaries and quiet dividers; not an adequate sole selected/error indicator. |
| Paper / foreground | `#F3F0E6` | Main readable text and selected neutral controls. |
| Muted foreground | `#B5B8AA` | Secondary explanations, metadata, and helper text. |
| Acid lime / primary | `#D7F46B` | Main action, selected destination, earned-result illustration, in-tolerance band. |
| Electric lilac / accent / focus | `#BEADF6` | Focus outline, simulated-input identity, pitch trail, small musical accents. |
| Warm error / destructive text | `#FFB4A7` | Actionable errors and Stop outline/text. |

Primary controls use Ink text on Acid lime; neutral selected segments use Ink on Paper. Accent text stays on an Ink/Panel surface. No light text is placed on the lime primary fill. Status always includes a readable label, not color alone.

Selected **opaque sRGB token-pair** calculations produced the following contrast ratios. These calculations do not certify actual rendered controls, opacity states, focus geometry, charts, or the whole application:

| Text / background | Calculated contrast |
| --- | --- |
| Paper / Ink | 15.79:1 |
| Paper / Panel | 13.62:1 |
| Muted / Ink | 8.91:1 |
| Muted / Panel | 7.69:1 |
| Ink / Acid lime | 14.61:1 |
| Ink / Electric lilac | 9.00:1 |

Measure final text, selected/disabled states, errors, and focus against their actual composited backgrounds during implementation. A quiet divider is decorative; the selected item also changes text, fill, or a visible marker and has an accessible state.

## Typography

The preview is deliberately offline and uses locally available system families. Its exact letterforms vary by platform; no font download is required. A future branded font would be a separate design and loading decision.

| Role | Family | Proposed treatment |
| --- | --- | --- |
| Task heading | `Georgia, "Times New Roman", serif` | 46px wide, 42px medium, 35px compact, 32px very narrow; weight 400, line-height around 1.12, modest negative tracking. |
| Body and controls | Platform system sans-serif | 15px base; 13–14px task explanations; 12–13px controls and secondary copy; input fields 16px on compact screens. |
| Pitch reading and numerical data | `SFMono-Regular, Consolas, "Liberation Mono", monospace` | 86px wide / 78px compact for the current pitch; octave as an attached smaller numeral; stable numerical alignment. |
| Section / category labels | System sans-serif | 10–11px, medium/bold, restrained tracking. Small branding captions are decorative, not the only label for a task. |
| Helper / sample labels | System sans-serif | 12px for core captions, task context, tolerance, recovery, and action consequences; 11px only for genuinely secondary information. Decorative category/branding labels can be 8–10px and never carry the only functional label. |

Use real headings and labels rather than text styled to resemble structure. Let long translated or accessibility-scaled content wrap. Do not shrink the entire application to fit a phone.

## Spacing, shape, and control geometry

- Base spacing rhythm: **4px** steps, with 8px, 12px, 16px, 24px, 32px, and 40px as recurring values.
- Content padding: about **42px wide**, **28px medium**, and **18px compact**; 13px at very narrow widths. Component padding shrinks independently of text.
- Wide stage/rail gap: **36px**. Context rail: **286px**, within the product's 280–360px proposal.
- Radius: **8–10px controls**, **12px note keys**, **16px compact exercise wells**, **20px wide wells/dialog**. Pills are reserved for small display statuses and grouping, not every surface.
- Standalone mobile controls target **44px** in height and useful width. Queue targets wrap instead of being squeezed into one row. The mini piano is a spatial instrument with an equivalent native note/octave answer path; geometry alone does not establish accessibility.
- Borders are mostly **1px**. The primary selected destination uses one clear accent; secondary regions use thin dividers rather than nested cards.
- The inner page reserves space from measured navigation and active-input-strip dimensions. Opening simulated capture must not cover the last answer, feedback, or focused control.

## Responsive composition

| Surface | Compact 320–767px | Medium 768–1199px | Wide 1200px and above |
| --- | --- | --- | --- |
| Navigation | All five labeled modes in a fixed bottom row, with safe-area padding. | Horizontal top navigation. | Horizontal top navigation. |
| Header | Compact wordmark plus Setup. | Wordmark, setup summary, Setup. | Same, with shared input status and Stop when relevant. |
| Notes task | Expressive Ready state; after Play, the heading and decorative listening well collapse to a compact Replay row, followed by references, answers, feedback, and continuation. | Same task with more breathing room; secondary context collapses below. | Main task alongside a context rail; optional keyboard stays near answers. |
| Answers | Ready uses a four-column twelve-note grid. After Play, a six-column/two-row grid keeps answers in view with at least 44px target width at 320px. Scale-excluded notes are disabled. Exact octave reveals nearby note and octave selects with Check answer. | Content-driven wider grid. | Six-column note grid; exact entry remains near the exercise. |
| Tuner | Target/free switch and a visible input action; Off/wait/error states place the action before the empty readout. Active input uses a large pitch, meter, and hold; history and queue follow. | Same core task. | Main tuner beside useful setup and singing guidance. |
| Setup | One responsive Dialog with scrollable fields, visible actions/status/Stop, and an immediate output-volume/mute section separate from the settings draft. | Drawer-shaped modal. | Drawer-shaped modal; the contextual rail offers summaries rather than duplicate editable fields. |
| Secondary help | Native disclosure after the task. | Disclosure after the task. | Context rail for Setup, musical guidance, and genuine progress. |
| Active input | Status/Stop strip immediately above navigation. | Shared toolbar. | Shared toolbar. |

On short landscape screens, the compact header stops sticking and navigation becomes a shorter horizontal icon/label row. Preserve vertical document scrolling, the active-input strip, and all essential actions. Do not force the whole task into one unscrollable viewport.

The preview's viewport controls do not promise real iOS/Android behavior. Safe-area, soft-keyboard, screen-reader, zoom, and actual device layouts remain validation work.

## Component reuse map

Production uses the selected **React + strict TypeScript + Tailwind + shadcn/ui + Motion** stack. The preview uses native HTML counterparts so it remains self-contained. It does not install, import, or test these production components.

| Product component | Reuse / custom boundary | States and behavior | Main UX criteria |
| --- | --- | --- | --- |
| App shell and five-mode navigation | Custom responsive composition; Controlled Radix-backed shadcn Tabs with manual activation, as chosen in the technical design. | Selected, focused, active mode, all destinations visible, no duplicate mobile/desktop trees. | UX-01.A/C/D, UX-08.A/B |
| Primary / secondary actions | shadcn Button, with shared variants and tokens. | Default, hover, focus, pressed, disabled, loading; literal action labels. | UX-03.A/B, UX-08.A/D/E |
| Setup sheet | One Radix-backed shadcn Dialog and one portal, with the same form at every width. Sheet-like desktop styling does not create a second mobile/desktop component instance. | Draft edits, validation, Apply, Cancel/Escape, focus restoration, local Stop/status. | UX-02.A–D, UX-05.B/D, UX-08.B |
| Immediate output controls | Shared shadcn Button and Slider section inside the same Dialog, available from every mode and width; optional synchronized wide Notes shortcut. | Volume value and mute state update immediately, survive Cancel, and never stop or disguise microphone capture. | UX-05.F, UX-02.B |
| Fields / range / presets / tuning | shadcn Field/Label, Select or native select, Input, Checkbox, Switch as appropriate. | Current values, Custom range, normalized tuning, errors, actual disabled state. | UX-02.C/D, UX-08.A/B/E, UX-09.A–C |
| Notes answer grid | Custom `NoteAnswerGrid` using shared Button variants. | Scale membership, enabled/disabled, selected wrong/correct, repeat-safe submission. | UX-03.A/C, UX-04.A, UX-08.A |
| Exact-octave entry | Shared Select/Input and Button composed into custom `PitchAnswerInput`. | Empty selection, wrong octave, correct, unavailable C6 combinations. | UX-04.A/B/D, UX-09.F |
| Optional piano | Custom `PianoKeyboard` and octave navigation, composed with shared Button/ToggleGroup. | Explicit Audition/Answer, octave window, range/scale membership, named action, keyboard alternative. | UX-04.B–D, UX-08.A/D |
| Tuner Target / Free selector | shadcn ToggleGroup or Tabs, consistently selected across the app. | Target task versus ungraded free tuner, no hidden target task in Free mode. | UX-06.A/B, UX-08.A/B |
| Pitch readout / error meter | Custom `PitchReadout` and `CentsMeter`. | Off, unavailable, silent, nearest-note vs target-relative error, octave mismatch, within tolerance. | UX-06.A–C |
| Hold progress | shadcn Progress for semantics and style shell; custom timing model outside React renders. | 0–1.5s, interrupted/reset, earned once, preview never eligible. | UX-05.E, UX-06.C, UX-13.C |
| Pitch history | Custom Canvas/SVG presentation with a bounded timestamped model and textual equivalent. | Current target reference, fixed history window, gaps, responsive labels, idle stop. | UX-06.D, UX-08.C, UX-12.A/C |
| Input status / Stop all | Custom shared lifecycle component composed with Button/Alert/Badge. | Off, preparing, permission waiting/cancel, simulated example, live, denied, interrupted, stopped; visible inside Setup too. | UX-05.A–F, UX-08.C |
| Learn / progress disclosure | shadcn Accordion/Collapsible with shared typography. | Optional context, no round reset, empty versus genuine sample-backed history. | UX-10.A/B, UX-11.B/C |
| Target queue | Custom queue composition with shared Toggle/Button primitives. | Current target, choose/skip, no credit for selection, wraps on phones. | UX-06.C, UX-08.A/D |
| Interval / chord filters | shadcn Checkbox or ToggleGroup, with custom vocabulary data. | Presets, minimum selection, draft settings, clear submission and inversion set. | UX-02.A/B, UX-03.D, UX-09.D/E |
| Harmony target and SATB lanes | Custom music-specific compositions using shared buttons, select, progress, and status. | Eight challenges, four named voices, mute/audition, progression step, Stop; Mixer is ungraded. | UX-07.A–D |
| Reset confirmation | shadcn AlertDialog using the TDD's durable reset contract. | Scope explanation, Cancel, confirmation, save/cleanup failure; no pre-reset state resurrection. | UX-10.C/D |

Use the same Radix-backed shadcn preset and variant conventions throughout; the [technical design](technical-design.md) owns exact package/toolchain choices. Component code reuse supplies tested building blocks, not proof that the composed application is accessible.

## Detailed scene decisions

### Notes on desktop

The editorial task heading leads into one bounded listening stage. Reference actions sit directly below it. Answers, feedback, and continuation form the next visual unit. The rail holds concise setup, a musical learning cue, and an honest empty-progress state. It does not compete with the exercise through fabricated KPI cards.

Exact-octave entry appears next to the task as two native fields plus Check answer. The keyboard is optional and declares its action before a key is used. Completed-result replay keeps the result closed; Next starts a fresh example in Ready. In this preview, the sample question is intentionally disclosed in helper text because no audio is played.

### Notes on a phone

All five modes remain visible. The rail becomes an optional Learn & progress disclosure. Ready uses four columns; an active round changes to six columns and two rows, with the large decorative waveform removed in favor of a compact Replay row. This responds to the observed 390px/short-height preview issue where answers had been below the fold. Disabled scale-excluded answers remain visually distinct and cannot be activated. The response and next action stay below the same grid. Exact-octave fields avoid searching for a distant footer piano.

### Tuner on desktop

The large pitch reading is the visual anchor. Target-relative cents, tolerance, and hold describe one task; the right rail explains setup and headphone use. A fixed-window trail adds supporting history without replacing the current reading. Free Tuner removes the target, hold task, queue, and Next rather than leaving irrelevant drill controls active.

### Tuner on a phone

The same meter, state language, and primary action remain. Off/wait/error scenes put their primary input action above the empty reading instead of making the learner scroll past a large placeholder. Input status and Stop are reachable above bottom navigation. Queue targets wrap. Pitch-axis labels are real HTML, keeping their readable size rather than shrinking with a fixed SVG viewBox. State examples show waiting/cancel, denied/retry, simulated input, simulated lock, silence/unusable input, interruption, and an octave mismatch; no screen pretends the preview has a real stream.

## Shared control and measurement rules

**Output controls are global and immediate.** Every mode can open Setup at every width. Its first section exposes Output volume, a percentage value, and Mute/Unmute; it explicitly says these are outside Apply/Cancel. Changing either updates the same shared state, including the wide Notes shortcut. Cancel keeps the immediate output change. Mute does not stop or alter simulated capture, and Stop all does not silently change the volume preference.

**Notation changes presentation, not question identity.** Notes answer labels and exact-note options follow Letter, movable-root Solfège, or chromatic Degree. Tuner's primary pitch and queue follow the selected notation, with scientific letter spelling supplied as context. Range endpoints, frequency references, physical piano keys, and history axes retain scientific note names so octave/range references remain unambiguous. Applying notation alone preserves the current question, selected target, and input state.

**Tolerance is visible and consistent.** In Target mode, the summary says “In tune: ±N cents from exact target.” On a −50…+50-cent meter, green guidance extends from `50−N` percent to `50+N` percent: ±12 produces 24% width, ±22 44%, and ±35 70%. Compact headings also expose the chosen tolerance and practice range. Free Tuner uses the same selected tolerance only as a nearest-note guidance band; it is explicitly ungraded and has no hold or target completion.

**Silence and interruption clear the current measurement.** Their examples show a dash rather than an old pitch, a zero hold, and recovery guidance. Simulated silence keeps the illustrative listening status/Stop available; interruption offers Retry without pretending input resumed. The octave-mismatch example shows nearest C5 at 0 cents relative to itself while target C4 is +1200 cents away, clamps the pointer at the labeled +50 boundary, and earns no hold. The frequency reading, meter description, and target-error text agree; the illustrative trail ends clamped above its target window rather than falsely ending at center. Meter description and text explain that the target error is beyond the displayed scale.

**Practice scope stays visible.** Compact Notes metadata shows key/scale and C3–C5-style practice range. Target Tuner's existing subtitle shows key/scale, practice range, and tolerance. Free Tuner instead shows “Free chromatic” and A4 tuning; it does not present practice range as a detector limit.

## Interaction and motion rules

- Button and selection feedback: **160ms**, short background/border or one-pixel press response.
- Width review changes are immediate, so a Phone or Desktop click cannot be mistaken for the previous viewport during a transition. Desktop uses a scaled 1320px inner canvas when necessary.
- Meter/illustrative hold movement: **180ms**. In production this treatment must not determine the actual hold duration.
- Prefer short opacity/transform transitions for interface state changes. Production Motion is for coordinated scene/result/overlay transitions when useful; ordinary Button hover does not require a Motion wrapper.
- Honor `prefers-reduced-motion`: decorative transitions become instant state changes. No idle waveform animation or permanently running beat loop.
- Showing Setup pauses the task. Apply commits edits; behavior-changing edits prepare Ready without auto-playing or starting input. Label-only edits preserve question identity. Cancel discards edits and never reverses Stop all.
- Real reference playback must suspend eligible live holds. The preview only demonstrates the distinction and never awards a score.
- Production feedback and announcements come from real outcome events. The live readout must not flood the accessibility tree with every frame.

## Review and verification limits

Completed static checks for this artifact: both embedded JavaScript blocks parse with `node --check`; HTML IDs are unique; there are no external URLs, network requests, microphone calls, or storage APIs in the preview. Selected opaque token contrast was calculated as listed above.

Browser screenshots, keyboard/assistive behavior, all viewport/orientation states, actual rendered contrast, native touch, real microphone/audio performance, and production shadcn integration require their own recorded validation. A design-preview click or static check does not pass the application's UAT scenarios.

Before implementation, Product Manager should review the proposed flow and component map against the 58 criteria. Full interaction design for Intervals, Chords, and Harmony remains a subsequent mode-design task; their presence in the navigation and preserved-feature inventory is not an implementation-completeness claim.
