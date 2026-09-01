---
"saleor-dashboard": patch
---

Stop filter presets from storing the list's pagination cursor (FEAT-145).

Örninn reported that dashboard list filters "cannot be saved". They can — the preset is written to
`localStorage` correctly — but it comes back empty, which reads the same way.

`prepareQs` stripped `activeTab`, `action`, `sort` and `asc` from the query string a preset stores, but not
`before`/`after`. Those are the list's pagination cursors, and a Saleor cursor is only valid for the sort order
it was captured under. So saving a filtered list from page 2 under a non-default sort stored the cursor and
discarded the sort that gave it meaning: the list blanks the moment you press save, every later reopen of the
preset is empty, and Saleor says why in a toast — "Received cursor is invalid." — while the header still reads
`Filters (1)`, so the filter looks applied and the products are simply gone.

Saving from page 1, or from page 2 under the default sort, worked, which is why this looked intermittent.

`before`/`after` now join the list of params a preset drops, so a preset always reopens at the start of the
list. Sorting is unchanged: it was already excluded from presets on purpose.

Cursors are dropped on read as well as on write. A preset saved before this change still holds its cursor, and
restoring it would reopen the same empty list — so `onPresetChange` strips `before`/`after` too, and an
already-broken preset heals itself the next time it is selected. Nothing has to be deleted and re-saved.
