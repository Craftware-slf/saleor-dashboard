---
"saleor-dashboard": minor
---

Catalogue promotion rules: saving a fixed-amount rule now checks the prices of the products and variants it names in the rule's channel, and refuses an amount that would take any of them entirely ("Invalid amount: … is at least the price of …"). Saleor would otherwise floor that price at 0. Categories and collections are not expanded, and a failed lookup does not block the save. (Örninn FEAT-251)
