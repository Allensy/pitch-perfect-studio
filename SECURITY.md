# Security

## Reporting a vulnerability

Please avoid publishing exploit details or private data in a public issue.
Use GitHub's [private vulnerability reporting](https://github.com/Allensy/pitch-perfect-studio/security/advisories/new)
if the repository offers that option. If it is unavailable, open a public issue
asking for a private contact channel without including exploit details.

Include the affected version or commit, reproduction steps, expected impact and
any suggested fix. Remove personal information, microphone recordings, browser
storage contents, credentials and private keys from reports.

There is no promised response time or support window. Fixes target the current
`main` branch; this project does not maintain security updates for older releases.

## Local development

The default development server listens on loopback. `npm run dev:network` and
`npm run dev:https` expose it to the local network for testing. Use these on a
trusted network and stop the server when finished; the Vite development server
is not a production hosting setup.

For phone microphone testing, use a certificate trusted by the phone. Keep
mkcert's `rootCA-key.pem` private and transfer only its public `rootCA.pem` when
installing the development CA. Do not commit certificates, private keys, `.env`
files or local browser data.

Microphone input is processed in the browser. The application does not upload
recordings or send analytics. Browser permission and secure-context requirements
still apply to microphone access.
