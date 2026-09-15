---
"saleor-dashboard": patch
---

Say "Select channel" in the Products list Stock column instead of a bare dash (FEAT-165).

The Stock column added in #19 is channel-dependent — Saleor scopes `variant.stocks` to the queried channel's warehouses, so with no channel selected the query returns every warehouse and a sum would be wrong. The column correctly declined to answer, but it did so with `-`.

That sits directly beside the Price column, which is channel-dependent in exactly the same way and prompts **"Select channel"**. A dash next to that prompt reads as "this product has no stock data" rather than "pick a channel", and it misled the first person to use the feature.

`getStockCellContent` now mirrors `getPriceCellContent`'s fallback exactly: same string, same faded styling. No behaviour change — with a channel selected the column still shows sellable units (`quantity - quantityAllocated`).
