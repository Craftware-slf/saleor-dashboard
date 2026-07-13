---
"saleor-dashboard": minor
---

Reformat ("Fix formatting with AI"): pass the product name to the model as context so it better understands what it's normalising, and serve the dashboard's `index.html` with `Cache-Control: no-store` so the runtime-injected `window.__SALEOR_CONFIG__` (e.g. `SALEOR_APP_BC_URL`) is never served stale from a browser/proxy cache.
