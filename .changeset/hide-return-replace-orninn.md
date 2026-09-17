---
"saleor-dashboard": patch
---

Hide "Return / Replace order" from the order detail menu (Örninn FEAT-198).

Örninn issue refunds from the Refunds card only. The "New refund" dialog already offers exactly the two methods they need — **Refund with line items** (the sanctioned default) and **Refund with manual amount** (goodwill and overcharges) — so the overflow menu's third path is the only way a staff member can reach a refund flow nobody intends them to use.

It is not merely redundant, it is **unsafe on this instance**. `useRefundWithinReturn` fires `orderFulfillmentReturnProducts` **first** and grants the refund **second**. So when the grant fails, the return has already been committed: lines marked returned, stock possibly restocked, and — for any line flagged `replace` — a replacement draft order created, with no refund against it. Unpicking that is manual work on a live order.

And the grant is *expected* to fail here. This instance sets `refundSettings.reasonReferenceType` (to a "Refund reason" model type), which makes `reasonReference` mandatory on `orderGrantRefundCreate`; the return flow hardcodes `reason: ""` and sends no reference at all. The two standalone refund pages collect both fields, so they are unaffected.

Hidden behind a `RETURNS_ENABLED` constant rather than deleted, because this is a *sequencing* decision, not a judgement that the flow is wrong: Örninn have no returns process yet — no return label in either carrier, no RMA, and no customer self-service returns by design. When that process is designed the guard goes back to `hasAnyItemsReplaceable(order)` and nothing else needs restoring.

Two notes for whoever touches this next:

**The flag is typed `boolean`, not left to infer `false`.** With the literal type TypeScript narrows `RETURNS_ENABLED && hasAnyItemsReplaceable(order)` to dead code and the call to `hasAnyItemsReplaceable` reads as unreachable, which trips both the compiler's unused-value analysis and the constant-condition lint rules. The annotation keeps the guard a live boolean expression.

**Hiding the menu item does not unregister the route.** `/orders/:id/return` still resolves and `OrderReturnPage` still renders if someone types the URL. That is deliberate — removing the route is a larger change, and no staff workflow reaches it by navigation. The message stays defined and referenced, so `extract-messages` produces no `locale/` diff.
