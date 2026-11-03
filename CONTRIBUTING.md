# Contributing

Thanks for helping improve Pitch Perfect Studio. Bug reports, usability feedback,
musical corrections and focused pull requests are welcome.

## Report an issue

Search [existing issues](https://github.com/Allensy/pitch-perfect-studio/issues)
before opening one. Include the mode, musical settings, steps to reproduce,
expected result and actual result. For browser or microphone problems, include
your browser, operating system, device, whether the page uses HTTPS, and any
permission error. Avoid sharing recordings or personal information unless they
are necessary and you are comfortable publishing them.

Report security concerns using [SECURITY.md](SECURITY.md).

## Set up development

Use Node.js 22.12 or later, or run `mise install` for the pinned version.

```sh
npm ci
npm run dev
```

The app runs at http://127.0.0.1:5174/. The [README](README.md#try-it-on-your-phone)
covers local-network and trusted HTTPS testing. No API keys are needed.

## Make a change

Create a branch and keep the change focused. For a larger feature, describe its
scope, visible states and acceptance criteria in the issue or pull request.
Historical requirements are in `docs/archive/`; distinguish implemented behavior
from older proposals. Preserve relevant requirement identifiers when changing
behavior tied to those documents.

- Keep music rules, grading and resource lifecycles separate from React rendering.
- Reuse existing components, theme tokens and accessible primitives.
- Keep all five training modes available on mobile and desktop.
- Exact-octave questions must require an octave-specific answer.
- Skips, reference playback and simulated microphone input must not earn credit.
- Pitch locks must use continuous elapsed time, independent of frame rate, and
  only accrue in the visible eligible mode.
- Clean up playback, timers and microphone streams, including delayed permission
  responses. Keep Stop and permission-error recovery usable.
- Preserve validated progress migration and the existing storage keys.
- Respect reduced-motion preferences and keyboard interaction.

## Verify your work

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run format` applies formatting. If you installed Playwright browsers in a
custom location, set `PLAYWRIGHT_BROWSERS_PATH` when running browser checks.

Add regression coverage for meaningful behavior changes. Inspect affected flows
at phone and desktop widths, including keyboard use, error states and long
labels. For audio or capture changes, also listen and test a real microphone
when available. Identify the browser/device you tested and separate actual
hardware results from mocked or simulated input.

## Open a pull request

Explain the problem, resulting behavior, relevant requirement or issue, and
validation performed. Include screenshots for visible changes and call out
remaining device checks. Do not commit local certificates, private keys,
`.env` files, recordings, generated builds or test reports.

Contributions are provided under the repository's [MIT license](LICENSE).
