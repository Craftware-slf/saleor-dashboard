---
"saleor-dashboard": minor
---

Add a "Category per store" card to the product details page (FEAT-185), below Organize Product, with one category picker per channel the product is listed in. It appears only on products listed in more than one channel, so the ~7,500 single-store products are unaffected.

Saleor allows a product exactly one `category`, but Örninn sell the same product across brand stores whose category trees are separate namespaces (`hjol-*`, `golf-*`, `fifa-*`), and nothing can infer where a bike travel cover belongs in golf's tree. The per-store placement is therefore stored as product metadata `category_<channelSlug>` holding a category slug, which Örninn's search indexer and storefronts already read; until now it could only be set by a script driven by a hand-edited mapping file. Without it a multi-store product appears on no category page in its second store and leaks the first store's root category name into that store's filters.

The value is written through the product form so it rides on `productUpdate`, **not** through the metadata dialog. That distinction is the feature: Saleor fires no `PRODUCT_UPDATED` for `updateMetadata`, so a value saved that way would report success and never reach the search index, leaving the store silently wrong. `productUpdate.input.metadata` merges rather than replaces, so writing one key leaves the product's other metadata intact. Clearing a picker writes an empty value, which reads downstream as "no override" and falls back to the canonical category.

The pickers are driven by live form state rather than the saved listings, so a store added in the same session gets its picker before the first save. `CategoryWithAncestors` now selects `slug` — the override is keyed by slug, deliberately unlike the id-keyed category field beside it.
