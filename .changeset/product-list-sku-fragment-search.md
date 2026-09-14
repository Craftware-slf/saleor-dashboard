---
"saleor-dashboard": minor
---

Find a product by a fragment of its SKU in the Products list search box (FEAT-188).

Örninn staff type part of a SKU into the Products page search and get nothing back. Confirmed against Saleor 3.23: searching `06287` for SKU `0100606287` returns **0 products**, even though the variant plainly exists.

The cause is not missing data. Saleor has **two** search entry points with opposite semantics:

- `products(filter:{search:})` → `prefix_search()`, which builds a raw tsquery with `:*` per lexeme against `product_product.search_vector`. It matches a query word only as the **prefix** of an indexed word. Every Örninn SKU opens with the same `0100…` run of digits, so the distinctive tail — the part staff actually remember — never matches.
- `productVariants(filter:{search:})` → `Q(name__ilike=v) | Q(sku__ilike=v)`, where `ilike` is `PostgresILike(IContains)` emitting a raw `ILIKE '%v%'` straight at the variant's sku column. A genuine case-insensitive substring match.

Variant SKUs **are** in the product search vector, at weight `"A"` — a *full* SKU matches fine. It is purely the prefix-only tsquery that kills fragments. So this needed **no fork of Saleor core and no external search index**: this dashboard's own top-bar global search already queries the ILIKE path, and so do the variant condition pickers. Only the Products list was left on the prefix path.

When a Products-list search returns zero rows **and** the term is SKU-shaped, the list now resolves the fragment through the variant filter and re-issues itself filtered by the resulting product ids.

Three things worth writing down for whoever touches this next:

**It is fallback-only, on purpose.** The lookup fires only after the primary search has already come back empty, so a search that works today can never be reordered, diluted or slowed by it. `isSkuShapedQuery` narrows it further to one unbroken run of SKU characters carrying at least two digits — `45087`, `JP84039` and `0100627364/36` qualify; `hjol`, `dekk 28` and `MULTI` do not, because full-text ranking serves those better than an ILIKE ever would.

**The fallback has to drop the sort, and this is not optional.** `useFilterHandlers` switches the list to `RANK` — full-text relevance — whenever a query is present, and Saleor rejects `RANK` outright once `search` is gone: *"Sorting by RANK is available only when using a search filter."* Without stripping it, every single fallback would have been a hard GraphQL error rather than a result.

**Watch the near-miss in the API.** The *top-level* `productVariants(search:)` argument is **not** the ILIKE path — it routes back through `prefix_search()` against the product's vector. Only the `filter: { search: }` form does the substring match. Likewise `productVariants(filter:{sku:[…]})` is `sku__in`, exact strings only, and `ProductVariantWhereInput.sku` is a `StringFilterInput` offering just `eq`/`oneOf` — there is no `contains` operator anywhere in the schema.

Cost is a sequential scan, since `ILIKE '%…%'` cannot use an index — measured at 10 ms over 32,300 variants, and only ever on a search that already failed. No index, migration or configuration is needed. The lookup reads at most 100 variants, so the fallback surfaces at most 100 products; past that, staff should type more of the SKU.

The storefront half of this ticket is a separate change in the Örninn monorepo, and takes a different route: Meilisearch is also prefix-only, but it has no ILIKE equivalent, so there the fix is to index every proper suffix of each SKU token as a `sku_fragments` field.
