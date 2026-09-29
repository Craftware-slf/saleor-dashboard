---
"saleor-dashboard": minor
---

Sort the product list by **SKU** and **Category** — click either column header to sort the whole list server-side, ascending or descending (Örninn FEAT-210).

Saleor 3.23 has no SKU or category product sort, so the orninn sync worker maintains two hidden PLAIN_TEXT product attributes — `sort_sku` (the product's lowest variant SKU) and `sort_category` (its category name, then product name) — each suffixed with the product id so the keys are unique, because Saleor's attribute-sort cursor has no pk tie-breaker and would otherwise skip tied rows between pages — and the list sorts by them with Saleor's `sortBy: { attributeId, direction }`.

- **Clean URLs.** The sorts are `?sort=sku` / `?sort=category`; the attribute ids are resolved by slug at runtime with one cached query and never written to the URL.
- **Degrades safely.** On an instance without the attributes the two columns stay unsortable (with the "not sortable" tooltip), and a `sort=sku` / `sort=category` link falls back to the name sort instead of erroring. A `sort=sku` URL waits for the lookup rather than querying unsorted first.
- Works with filters, text search and the SKU-fragment search fallback (FEAT-188), which keeps a non-RANK sort.
- Products with no value sort last ascending and first descending (Saleor's attribute-sort behaviour).
