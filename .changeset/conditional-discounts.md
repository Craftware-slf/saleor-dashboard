---
"saleor-dashboard": minor
---

Add a "Conditional" discount type for Örninn's cart-condition discounts (FEAT-246): "every 4 units at 15% off", "15% off at 8, 12 or 16" and "buy 2, get 1 free". Saleor cannot express these, so a conditional discount is saved as an Order promotion with no Saleor rules and its condition and reward are stored as JSON in the promotion's `orninn_conditional` metadata, which the Örninn storefront evaluates.

Picking "Conditional" in the create page's Discount type hides the Rules section and shows a Conditional discount card: channels, the products / categories / collections it applies to, "same product only", the quantity rule, the discount, and optional Icelandic and English banner text with the automatic sentence shown in grey and a live preview. Saving writes the metadata and then updates the promotion, so the PROMOTION_UPDATED webhook fires after the rule is stored. Promotions carrying the rule open as "Conditional" on the details page and in the list. A stored rule the form cannot represent (every unit once triggered, cross-sell) is shown read-only and left untouched on save; unknown keys and variant ids in the stored JSON are preserved.
