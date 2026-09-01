---
"saleor-dashboard": minor
---

Add a "Publish on <channel>" button to the product details page (FEAT-144), one per channel the product is listed in, below the Availability card. Publishing a finished product previously meant expanding the channel in that card and setting three separate controls; the button sets `isPublished`, `visibleInListings` and `isAvailableForPurchase` together, so a product cannot be left in the half-published state that reads as live in the dashboard and cannot be found or bought.

The button appears only while a channel is not fully published, and reads "Finish publishing on <channel>" for a product that is published but still hidden from listings or not available to buy. It acts on the SAVED listing rather than form state, so a channel with unsaved availability edits shows the reason and stays disabled instead of quietly writing over them.

Saleor hard-blocks publishing a product with no category, and returns that refusal inside the mutation payload's `errors` while leaving the top-level GraphQL errors empty — a handler that only catches thrown errors reads it as a success. The button checks the payload and reports `PRODUCT_WITHOUT_CATEGORY` in plain language; a product with no saved category is also pre-emptively disabled with the same explanation, matching how the Organize Product card already surfaces that error on save.
