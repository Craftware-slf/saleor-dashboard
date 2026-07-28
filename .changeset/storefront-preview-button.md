---
"saleor-dashboard": minor
---

Add "Preview on storefront" buttons to the product details page (FEAT-069). Each opens that product's storefront PDP in a new tab, including edits the editor has not saved yet — Saleor has no draft layer, so the current form state is POSTed to the storefront rather than read from the server. Once a tab is open, further edits stream to it and it re-renders itself; price and stock are shown as last saved, since Saleor computes those.

One button per Saleor channel the product is listed in, labelled with the channel name, so a product sold in more than one brand can be previewed on each storefront. Configured by three runtime-injected variables — `STOREFRONT_PREVIEW_URL_HJOL`, `_GOLF`, `_FIFA` (mirroring the existing `SANITY_STUDIO_PREVIEW_URL_*` convention) — plus `PREVIEW_ALLOWED_ORIGIN` on the storefront side for the live-update pushes. A channel with no configured URL simply gets no button, so a partly configured deploy degrades to "no feature" rather than a broken button.

Also exposes `getAttributeRichTextValues` from the product update form so the unsaved `specifications` value can be read outside submit. The description is read from the page's existing `descriptionCache` ref rather than `richText.getValue()`, which clears the dirty flag and would make the editor's next save drop their description edits.
