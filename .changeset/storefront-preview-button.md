---
"saleor-dashboard": minor
---

Add a "Preview on storefront" button to the product details page (FEAT-069). It opens the product's storefront PDP in a new tab, including edits the editor has not saved yet — Saleor has no draft layer, so the current form state is POSTed to the storefront rather than read from the server. Price and stock are shown as last saved, since Saleor computes those.

Configured by two runtime-injected variables, `STOREFRONT_PREVIEW_URL` and `STOREFRONT_PREVIEW_CHANNEL` (defaults to `hjol`); an empty URL hides the button. The button also stays hidden for products not listed in that channel, because Saleor's channel-scoped PDP query would 404 for them.

Also exposes `getAttributeRichTextValues` from the product update form so the unsaved `specifications` value can be read outside submit. The description is read from the page's existing `descriptionCache` ref rather than `richText.getValue()`, which clears the dirty flag and would make the editor's next save drop their description edits.
