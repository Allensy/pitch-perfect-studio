# Pitch Perfect Studio

A pocket rehearsal room for ear training and vocal practice, built with React,
TypeScript and Web Audio.

**[Open the app](https://allensy.github.io/pitch-perfect-studio/)** — HTTPS hosting
supports phone microphone permission without a local development certificate.

- **Notes:** identify pitches by note name or exact octave.
- **Intervals:** practice twelve intervals with melodic and harmonic playback.
- **Chords:** recognize eleven chord qualities and their inversions.
- **Harmony:** sing a target against backing tones, or rehearse with a four-part SATB mixer.
- **Tuner:** explore a free tuner or practice target, scale and arpeggio drills.

Shared musical setup includes instrument, vocal range, key, scale, note labels
and tuning. Progress stays in your browser. No account or backend is required.

## Quick start

Use Node.js 22.12 or later. [mise](https://mise.jdx.dev/) users can run
`mise install` to install the version pinned in this repository.

```sh
git clone https://github.com/Allensy/pitch-perfect-studio.git
cd pitch-perfect-studio
npm ci
npm run dev
```

Open **http://127.0.0.1:5174/**. Press Play or a piano key to start sound.
`npm start` is an alias for the same development app.

Microphone practice asks for permission. Headphones help keep backing tones out
of the microphone. **Preview input is simulated** and never earns progress.

## Try it on your phone

Connect your computer and phone to the same local network, then run:

```sh
npm run dev:network
```

Open the **Network** URL printed by Vite on your phone, for example
`http://192.168.1.20:5174/`. Keep the terminal running. If it will not connect,
allow the Node process through your computer's firewall and check that your
Wi-Fi does not isolate devices. This command exposes the development server to
your network; use it on a trusted network.

Listening exercises and the interface work over local-network HTTP.
**Microphone access requires trusted HTTPS on the phone**; a local IP address
served over HTTP does not qualify as a secure context. See
[MDN's microphone requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security).

### HTTPS for microphone testing

Install [mkcert](https://github.com/FiloSottile/mkcert#installation), stop the
running development server, and replace `192.168.1.20` below with your computer's
actual local IP address:

```sh
mkcert -install
mkdir -p .certs
mkcert -key-file .certs/dev-key.pem -cert-file .certs/dev-cert.pem localhost 127.0.0.1 ::1 192.168.1.20
npm run dev:https
```

Open `https://192.168.1.20:5174/` on the phone. The certificate must cover the
address you open; regenerate it if the computer's local IP changes.

The phone must also trust mkcert's local certificate authority:

1. Run `mkcert -CAROOT` on the computer to find its certificate directory.
2. Transfer **only `rootCA.pem`** to the phone and install it as a trusted CA
   certificate. On iOS, install the downloaded profile, then enable full trust
   under **Settings → General → About → Certificate Trust Settings**. Android's
   certificate installation menus vary by device.
3. Reload the HTTPS URL and allow the browser's microphone request.

Keep `rootCA-key.pem` private: never transfer or commit it. The repository
ignores `.certs/` and certificate/key files. Dismissing a certificate warning is
not a replacement for installing and trusting the CA. See
[mkcert's mobile-device guidance](https://github.com/FiloSottile/mkcert#mobile-devices).

HTTP, HTTPS, localhost and LAN addresses each have separate browser storage, so
your phone will start with its own progress.

## Development

### Deployment

GitHub Pages publishes the app at
<https://allensy.github.io/pitch-perfect-studio/>. On a push to `main`, the CI
workflow runs checks and browser tests, then builds and deploys the static site.
Pull requests run validation without publishing. To redeploy the current `main`
commit, run the CI workflow manually from GitHub Actions.

The repository Pages source must be **GitHub Actions**. `npm run build:pages`
uses the `/pitch-perfect-studio/` asset base; `npm run build` keeps `/` for other
hosting. To inspect the Pages build locally:

```sh
npm run build:pages
npm run preview -- --mode github-pages
```

Open <http://127.0.0.1:4174/pitch-perfect-studio/>. Microphone permission is still
required on the hosted app, and its browser history is separate from localhost.

### Checks

```sh
npm run check         # TypeScript, lint and formatting checks
npm test              # Typed domain, audio, persistence and runtime regressions
npm run build         # Production static build in dist/
npm run preview       # Preview the build on port 4174
npx playwright install chromium
npm run test:e2e      # Chromium interaction and responsive-layout checks
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow,
[architecture notes](docs/architecture.md) for module contracts, and
[SECURITY.md](SECURITY.md) for vulnerability reporting.

```text
src/
  domain/             Music vocabulary, generation and grading
  components/         Shared controls and contextual help
  audio.ts            Synthesis, playback and microphone capture
  runtime.ts          Exercise lifecycle and scoring
  persistence.ts      Validated settings and progress storage
  App.tsx             Practice interface
  styles.css          Theme and responsive layouts
tests/                Unit and service regressions
e2e/                  Browser scenarios
docs/archive/         Historical product, UX and technical design documents
```

Audio services and pure music rules live outside React rendering. Live pitch
updates go to the pitch display without rerendering the whole app. The interface
uses Tailwind CSS, owned Radix-backed controls and Motion.

## Privacy and compatibility

Microphone input is analyzed locally. The application does not upload recordings,
load external audio samples, or send analytics. Progress and preferences use
local storage under `pitch_perfect_studio_v2`; valid same-origin history from
`pitch_perfect_studio_v1` is imported once as a separate legacy snapshot. Clearing
browser storage removes local progress. Concurrent tabs do not merge progress.

Automated Chromium checks cover layouts from 320 to 1320 pixels, practice flows,
dialog focus and mocked microphone permission recovery. They do not establish
real-device microphone quality, listening quality or assistive-technology
support. iPhone Safari, Android Chrome and desktop Safari still need device
validation. There are no accounts, cloud sync, guided courses or native app
packages.

On browsers with the Audio Session API, the app requests media playback mode
and restores it after microphone use. This is intended to avoid silent-switch
muting and a persistent recording-mode volume drop on supported mobile browsers.
The OS may still use a different volume level while the microphone is active.
Browsers without this API may require turning silent mode off.

The product began as a standalone HTML prototype. That comparison app has been
retired; [archived planning documents](docs/archive/) retain historical
requirements and proposed work, and are not a current feature or test-status
checklist.

## License

[MIT](LICENSE).
