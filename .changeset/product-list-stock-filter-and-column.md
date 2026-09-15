---
"saleor-dashboard": minor
---

Filter the Products list by stock availability, and show a Stock column (FEAT-165).

Örninn staff had no way to pull up the products that are sold out. The Products list offered eleven filter fields — price, category, collection, channel, productType, isAvailable, isPublished, isVisibleInListing, hasCategory, giftCard, attribute — and none of them was about stock. The only out-of-stock surface in the whole dashboard was the Welcome page's stat card (`welcomePage/queries.ts`), which is a static tile with no click-through: staff could read the number and still not reach the products behind it.

This adds `stockAvailability` as a twelfth field, plus an optional **Stock** column (off by default) on the same list.

**No schema work was needed.** `ProductWhereInput` has carried `stockAvailability` all along; it was simply never exposed as a `LeftOperand`. The base field list `STATIC_PRODUCT_OPTIONS` is a hardcoded array and nothing introspects the schema to extend it — only the *attribute* sub-filter is API-driven — so the field could never have appeared on its own.

Four things worth writing down for whoever touches this next:

**The filter forces a channel, and that is a Saleor constraint rather than a UX preference.** A channel-less `products(filter: { stockAvailability: … })` answers `More than one channel exists. Specify which channel to use.` — measured against production, and **with a staff token**, so it is not a permissions effect: the same token lists all 7,493 products channel-lessly the moment the field is dropped. `stockAvailability` is therefore registered in `CONSTRAINTS.channel.dependsOn`, which makes the UI auto-create a locked Channel row, exactly as Price and IsPublished already do. There is no all-channels variant to offer; staff use one saved preset per brand.

**It is an enum, so `StaticBooleanQueryVarsBuilder` cannot take it.** That builder's `SUPPORTED_STATIC_BOOLEAN_FILTERS` is true/false only. The new `StockAvailabilityQueryVarsBuilder` follows the `StaffMemberStatusQueryVarsBuilder` shape and emits the bare enum — both `ProductFilterInput` and `ProductWhereInput` take it unwrapped, with no `eq`.

**`ProductFilterKeys.stock` is a decoy.** `src/products/views/ProductList/filters.ts` maps a `stock` URL param to `StockAvailability`, which reads like the feature already exists behind a flag. Nothing anywhere constructs a `FilterElement` with that key — it is dead pre-ConditionalFilter plumbing inherited from upstream, and wiring into it would have produced a filter that silently never applied.

**The Stock column is channel-dependent for a measured reason.** It sums `quantity - quantityAllocated` across a product's variants. Saleor scopes `variant.stocks` to the warehouses assigned to the queried channel, so with a channel selected the returned rows are already the right ones and a plain sum is correct. With no channel the query returns *every* warehouse, which on this catalogue includes a retired one — sampling 100 products, 380 variants carried stock in more than one warehouse, so an unscoped sum would have roughly doubled the real figure. Rather than hardcode warehouse slugs (they are data, not code), the cell shows a dash until a channel is chosen, the same bargain the Price column already makes.

Subtracting allocations matters and is visible on the first row of the filtered list: `1-Arm Holder 35mm` holds quantity 5 with all 5 allocated. Saleor rightly calls it out of stock, and the column shows **0** — the raw quantity would have read `5` and contradicted the filter that surfaced it.

The list query now selects `variants { stocks { … } }`. Deliberately **not** `quantityAvailable`: that field is channel-resolved and throws the same "More than one channel exists" error for cross-listed products on the default channel-less list. Measured cost on a 100-row page against production: 273 ms before, 416 ms after.
