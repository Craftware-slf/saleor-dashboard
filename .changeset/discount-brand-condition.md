---
"saleor-dashboard": minor
---

Add **Brands** as a condition for catalogue promotion rules (Discounts → Promotions → Add rule → Conditions) (Örninn FEAT-206).

Every brand is a Saleor Collection maintained by Örninn's sync worker, marked by the `brand_page_id` metadata key (slug `brand-<page>`, name `Brand: <title>`). Those collections are unpublished and have no channel listings, so the Collections condition — which searches in the rule's channel — could never offer them.

- **Brands condition.** Searches collections with `filter: { metadata: [{ key: "brand_page_id" }] }` and deliberately **no channel** (a channel-scoped query returns none of them). Options are labelled with the collection name.
- **Saved as a plain `collectionPredicate: { ids }`.** There is no brand predicate in the API, and no marker is added to the predicate, so nothing trips the nested-conditions check and anything reading `collectionPredicate.ids` keeps working. A rule with both a Brands and a Collections condition saves them as two OR-ed collectionPredicates.
- **Loaded back by metadata.** The selected-options details query now fetches `brand_page_id`, and every collectionPredicate is split into a Collections condition (regular ids) and a Brands condition (brand ids) — including a single predicate that mixes both. Brand ids from rules saved in the current session are remembered too, because the details query runs once per page load.
- **Collections excludes brands.** The Collections condition drops brand collections client-side (there is no negated metadata filter); "load more" still follows the unfiltered page.
- Rule summary chips for brands read "Brands" and link to the collection.

Also fixes `getAllConditionsOptionsIdsToFetch` mutating a shared module-level accumulator, which leaked ids between calls.
