---
"saleor-dashboard": minor
---

Stop the product Availability card warning about stock on Örninn bundle products (product type `bundle`). A bundle is sold as its parts and its only variant is a stockless placeholder on purpose, so the "No stock in warehouses" check is skipped for it and the public API verification explains the bundle instead of reporting it "Not purchasable".
