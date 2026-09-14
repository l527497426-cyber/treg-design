# Treg landing integration

- `/`: animated landing page.
- `/app.html#start`: existing Getting started design prototype.
- `/app.html#catalog`: existing Catalog prototype.
- Existing `/#start`, `/#catalog`, and `?view=start|catalog` links redirect to the app.
- Sign in / Start free open the existing prototype; no real authentication is added or bypassed.

Original app sources, data and assets are preserved. `landing/` contains only current
runtime HTML, CSS, JS, SVG assets and vendor notices. Historical revisions, captures,
source downloads, generated images, local dependencies and model-editor exports are excluded.
Three.js is installed at the pinned local version 0.180.0 and copied at build time.
