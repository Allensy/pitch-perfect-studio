# Pitch Perfect Studio

Browser app for note, interval, and chord recognition, harmony practice, and
microphone pitch matching. Imported from the user's standalone HTML prototype.

## Structure

- `index.html`: Vite entry for the React application.
- `src/App.tsx`, `src/components/`, `src/styles.css`: interface, shared controls,
  theme and responsive layouts.
- `src/domain/`: pure typed music rules, vocabulary, generation and grading.
- `src/audio.ts`: Web Audio synthesis, playback and microphone resource ownership.
- `src/runtime.ts`, `src/store.ts`: application lifecycle and immutable stores.
- `src/persistence.ts`: validated settings/history and legacy migration.
- `tests/`: typed unit, audio, persistence and runtime regressions.
- `e2e/`: Playwright browser flows.

The standalone vanilla comparison app has been retired. Keep the original
Downloads prototype untouched; this repository is the working application.

## Product documents

Current module contracts are documented in [architecture notes](docs/architecture.md).
Historical artifacts are archived in `docs/archive/`:

- [Product specification](docs/archive/product-spec.md): audited prototype baseline
  and preservation requirements.
- [UI/UX improvement plan](docs/archive/ux-improvement-plan.md): proposed behavior,
  scoped tickets and acceptance scenarios.
- [Technical design](docs/archive/technical-design.md): architecture, lifecycle,
  storage and implementation stages.
- [Visual design guide](docs/archive/design-system.md): design tokens, responsive
  composition and component inventory.
- [Product design review](docs/archive/design-review.md): historical spec coverage
  and findings, separately from production UAT and stakeholder acceptance.

Consult relevant criteria when implementing a spec. Distinguish historical
behavior, proposed improvements, implemented behavior and unexecuted UAT. The
current request and application source determine current scope; historical
source links and illustrative file trees may refer to retired files. Preserve
relevant requirement identifiers in implementation handoffs.

## Development

- `npm start` / `npm run dev`: app at `http://127.0.0.1:5174`.
- `npm run dev:network`: HTTP access from the local network.
- `npm run dev:https`: local-network HTTPS using ignored development certificates.
- `npm run check`: strict TypeScript, lint and formatting checks.
- `npm test`: typed regressions.
- `npm run test:e2e`: browser regressions.
- `npm run build`: production static build; `npm run preview` previews it.
- Browser-check affected modes; microphone permission and actual audio need a
  browser and hardware. Do not claim hardware validation from simulated input.
- Phone microphone testing requires trusted HTTPS; see the README. Never commit
  certificates, private keys, environment files or local user data.

## Conventions

- `main` is protected. Make changes on a topic branch and open a pull request;
  never push directly to `main` or disable protection. Leave approval reviews
  to the human owner, `@Allensy`; do not submit an approval using the owner's
  credentials. Only Allensy has a PR-only review bypass, permitting owner-authored
  PRs to merge without self-approval. Required CI, up-to-date branches, resolved
  conversations, and force-push/deletion protections still apply to the owner.
  Use the owner bypass to merge only when the current user request authorizes
  that merge; do not use it to bypass review of unrelated changes.

- Use React, strict TypeScript, Vite, Tailwind CSS, owned Radix-backed components
  and Motion. Preserve Web Audio services and pure music rules outside React
  rendering; avoid broad renders for live pitch samples.
- Preserve all existing modes and migration from `pitch_perfect_studio_v1` to
  `pitch_perfect_studio_v2`. Normal practice must not alter legacy history.
- Skips and simulated microphone input must never earn XP or change accuracy.
- Exact-octave questions require an answer that specifies the octave.
- Pitch locks require a continuous duration in tune, independent of frame rate.
- Only the visible microphone or harmony mode should accumulate pitch locks.
- Keep microphone streams stoppable and explain permission failures in the UI.

## Spec-driven specialist work

Both UI Engineer and Music Product Manager work from the current user request,
agreed spec, and applicable project constraints. For a small task, the request
can serve as the working spec. For a larger feature without a spec, create a
concise working spec with scope, observable requirements, relevant states, and
acceptance criteria; label assumptions without adding a mandatory approval gate.

Maintain requirement and acceptance identifiers through research, tickets,
implementation, and UAT when the scope warrants it. Surface conflicting
requirements and record material scope changes. Distinguish proposed, agreed,
implemented, and verified behavior.

## Music Product Manager specialist

When the user assigns work to Music Product Manager or requests this
specialist's music research, UX, spec, ticket, or UAT expertise, read
[the Music Product Manager skill](skills/music-product-manager/SKILL.md) and its
linked profile. Its native definition is staged at
[agents/music-product-manager.toml](agents/music-product-manager.toml).

When a registered `music_product_manager` agent is available and the user asks
for delegation, delegate the scoped product task to it. Otherwise apply its
guidance in the current agent. A handoff to UI Engineer should include the spec,
relevant evidence, flow states, requirement identifiers, and acceptance criteria.

## UI Engineer specialist

When the user assigns work to UI Engineer or requests this specialist's design
or frontend expertise, read [the UI Engineer skill](skills/ui-engineer/SKILL.md)
and its linked agent profile. Use the profile for that task while preserving this
project's conventions and audio behavior.

The native custom-agent definition is staged at
[agents/ui-engineer.toml](agents/ui-engineer.toml). When a registered
`ui_engineer` agent is available and the user requests delegation, delegate the
scoped UI task to it. Otherwise apply its guidance in the current agent.

## Specialist registration

Both specialists' staged files are available through this project's
instructions. Native agent discovery requires the TOML file in `.codex/agents/`
for this project or `~/.codex/agents/` for personal use. Automatic skill discovery
requires the corresponding `skills/` subfolder in a supported skill location.
Reading the staged profiles does not imply they are registered native agents.
