---
"saleor-dashboard": minor
---

Make the Products → Filters **Category** value dropdown browsable (FEAT-083).

It fetched `first: 5`, unsorted, and showed the category name only. With ~370 categories across Örninn's three brands that made it unusable: an empty search box always returned the same arbitrary five — the `hjol` root and its first children, because Saleor returns categories in MPTT tree order — so you had to already know what you were looking for. Örninn reported it as the dropdown "listing several unrelated naming worlds".

Three changes, only to the category handler:

- **`first: 100`.** Saleor caps this connection at 100 and errors above it, so this is the most the dropdown can ever show. An empty box still cannot list all ~370; typing narrows it well below the cap.
- **`sortBy: { field: NAME, direction: ASC }`**, so the list is predictable instead of tree-ordered.
- **The slug in the label** (`Clothing · golf-fatnadur`). Category names repeat across brands — three "Clothing", two "Clubs", two "Women's Golf Apparel" — and the slug is the only thing that distinguishes them. Sorting alphabetically makes those duplicates adjacent, so this has to ship with it, not after.

Mapped locally in `CategoryHandler` rather than in `createOptionsFromAPI`, which is shared with the collection, product-type and product handlers — those keep their existing labels and their `first: 5`.
