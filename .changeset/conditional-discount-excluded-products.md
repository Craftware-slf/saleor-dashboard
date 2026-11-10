---
"saleor-dashboard": patch
---

Conditional discounts (Örninn FEAT-260): "Applies to" gains an "Excluded products" picker. An excluded product never gets the discount and doesn't count towards the quantity, even when a product, category, collection or brand in the rule matches it. Stored as `excludedProducts` on the rule; rules saved without it round-trip unchanged.
