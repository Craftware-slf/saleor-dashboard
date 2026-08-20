---
"saleor-dashboard": minor
---

Add two entry points for the Örninn customer-email editor (FEAT-091). The editor itself is a page of the Örninn app; Saleor's app-extension mounts cannot reach either place a manager looks for it — none of the 51 mount points is Configuration- or plugin-related — so both live here.

A **Configuration → Emails → "Customer emails"** card sits beside Shipping, Taxes and Site settings, gated on `MANAGE_PLUGINS`. A **callout on Extensions → Installed → User emails** points off that page: it is the generic plugin renderer, 38 fields per channel with 16 raw-HTML textareas and nothing saying when an email fires, so it links to the editor rather than replacing it — the SMTP sender fields live there and nowhere else.

Both resolve the app's dashboard URL at runtime through `useOrninnEmailEditorUrl`, matching on the manifest `identifier` rather than the display name, and render nothing when the app is not installed so an environment without it degrades to no link rather than a dead one.
