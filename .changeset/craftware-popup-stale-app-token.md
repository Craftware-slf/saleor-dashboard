---
"saleor-dashboard": patch
---

Craftware: app extension popups and widgets no longer open with an expired access token. The token from the cache-first ExtensionList query was minted once per page load and died five minutes later, so any popup opened after that showed the app's "session expired" error until the whole dashboard was reloaded. POPUP and WIDGET frames now re-mint their own extension token (network-only `appExtension(id)`) when opened on a stale one, before it expires while open, when the tab regains focus, and when the app asks again.
