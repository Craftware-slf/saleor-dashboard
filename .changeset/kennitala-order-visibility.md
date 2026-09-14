---
"saleor-dashboard": patch
---

Show the buyer's kennitala on the order, and stop the private-metadata panel being editable (FEAT-171).

Örninn staff could not find a customer's kennitala anywhere useful. It **was** always captured — the storefronts stamp it on the checkout as **private** metadata under key `kennitala`, Saleor copies it to the order, and the Business Central sync reads it from there. The problem is purely where 3.23 puts it: private metadata lives behind an **unlabeled `</>` icon** in the order header → modal → a **collapsed** "Private Metadata" accordion. Two clicks, no text label, and the accordion heading reads "Private Metadata" in English even under an Icelandic locale (`locale/is.json` id `ETHnjq` is untranslated, and prod sets no `LOCALE_CODE`). The "new feature" ripple that used to point at that icon expired seven days after 2026-05-31, so nothing signposts it any more.

Three changes:

1. **A `Kennitala` line in the order's Customer details card**, between the email and the shipping address — visible on page load, no clicks, no scrolling. No query change was needed: the value already arrives on `OrderDetailsFragment` via the `...Metadata` spread.

2. **An optional `Kennitala` column on the order list.** `OrderList` previously selected no metadata at all, and the column set was a fixed seven, so the list could neither fetch nor show it. **Off by default**, opt-in through the column picker — `ListViews.ORDER_LIST` in `src/config.ts` is deliberately untouched, because a national ID in a sortable, scrollable column is a different privacy posture from one order at a time. Not sortable: Saleor cannot order by private metadata, and `canBeSorted()` already returns false for unknown columns.

3. **An order's private metadata is now read-only in the metadata dialog.** BC keys the customer card by this exact value (`number: kt`), so a hand-edit silently breaks an order's link to its BC customer — and the panel previously offered editable fields, a per-row delete button and Save with no warning at all. Scoped behind a new `readonlyPrivateMetadata` prop that only `OrderMetadataDialog` passes, so public metadata and every other `MetadataDialog` consumer keep their current behaviour.

Two things worth writing down for whoever touches this next:

**Read-only here removes the affordance, not the capability.** Anyone holding `MANAGE_ORDERS` can still call `updatePrivateMetadata` directly, and this dashboard ships a GraphQL Playground in its own sidebar. Real enforcement would have to live in the Saleor backend, which has no per-key metadata permission. This stops the accidental edit, which was the actual risk.

**`readonly` on `MetadataCard` keeps the `<textarea>` and marks it `readOnly`** — it does not swap in plain text. A test asserting `queryByRole("textbox")` is absent therefore passes for the wrong reason; assert the attribute instead.

The kennitala renders as `DDMMYY-NNNN`, but the detail page's copy button yields the **raw 10 digits**, because that is literally BC's customer `No.` and so pastes straight into a BC lookup. Orders placed before the field was captured render "Not provided" rather than a blank row. Organisation kennitölur (day + 40) display correctly — `normalizeKennitala` deliberately does not validate date ranges, which the B2B lookup depends on.

Searching orders by kennitala is **not** included and is not possible from this repo: Saleor's order search vector indexes no metadata at all, and both metadata filter APIs (`filter_metadata`, `filter_where_metadata`) match only the public `metadata` column — despite `OrderWhereInput` exposing a `metadata` filter that this dashboard's `OrderList` query already passes, which makes it look one small change away.
