---
"saleor-dashboard": minor
---

Add a "New badge window (days)" field to the Channel details page. It reads and writes the channel's `new_badge_window_days` metadata (upsert — other keys are preserved), which the storefront's new-arrivals reconcile job uses to decide how recently a product must have been created to count as "New".
