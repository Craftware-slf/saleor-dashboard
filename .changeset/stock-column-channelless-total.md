---
"saleor-dashboard": minor
---

Show a stock number in the Products list Stock column even with no channel selected (FEAT-165).

The column shipped in #19 and #20 answered only once a channel was picked — before that it showed "Select channel", which meant the default Products view (the one staff actually open) had a column that never said anything. Three separate rounds of confusion later, that is the wrong trade.

**The original justification for refusing to answer was wrong.** It claimed a channel-less sum would roughly double the real figure, citing "380 of 100 products' variants carry stock in more than one warehouse" and `orninn_warehouse` holding 381 rows / 4290 units. That was measured on a **local** stack and written up as if it were production evidence. Re-measured on prod: the retired `orninn_warehouse` holds **zero** stock rows and does not appear at all; across 201 sampled variants, **zero** had stock in more than one warehouse. A channel-less sum is correct on production.

It is *not* correct everywhere, though — the local stack really does have 381 stale rows in that retired warehouse, and counting them makes a sold-out product read 85 instead of 0. So the channel-less total counts only warehouses reachable from some channel:

- With a channel selected, nothing changes: Saleor already scopes `variant.stocks` to that channel's warehouses, so every returned row counts.
- With no channel, rows are filtered to warehouses that appear under `channels { warehouses }`. Warehouses assigned to no channel hold leftovers, not sellable stock.

The set is **derived from the API, not hardcoded** — a new brand or a re-activated warehouse must not require a dashboard change. The query is skipped entirely when a channel is selected, and while it is in flight the column keeps showing the prompt rather than a premature `0`, which would read as "sold out".

The resulting figure is a cross-brand total until a channel narrows it. That is a slightly different question from per-channel stock, but a number staff can act on beats a prompt they must satisfy before the column says anything.

Measured on prod across 1,200 products: **0** have no variants and **0** have no stock rows, so every row now shows a digit — 158 of them `0`, which is the sold-out set, not missing data.
