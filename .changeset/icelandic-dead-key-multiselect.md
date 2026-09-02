---
"saleor-dashboard": patch
---

Fix Icelandic (and any dead-key/IME) input in multiselect fields (FEAT-147).

Örninn staff on an Icelandic keyboard could not type accented vowels into the product page's **Collections** field: `Nýjar` came out as `N´ýjar`, so searching for the rail collections `Nýjar vörur (hjol)` / `Vinsælar vörur (hjol)` returned no options at all and the product could not be assigned to them.

The cause is upstream in `@saleor/macaw-ui@1.4.2`, not this fork — the diff against upstream `3.23` over `src/components/Combobox` and `src/products/components/ProductOrganization` is empty. macaw's `Multiselect` and `DynamicMultiselect` pass downshift's `getInputProps` a `value` from their own `useState`, which is written only from downshift's `onStateChange` — and downshift fires that from a post-commit `useEffect`. So every keystroke commits one render holding the *previous* text, React DOM rewrites `input.value`, and rewriting `value` during an active composition aborts it: the dead key is stranded as literal text and the vowel appends after it. The single-select `Combobox`/`DynamicCombobox` never pass `value`, which is why Category and the list-view search box were unaffected.

Only macOS is affected — it routes dead keys through the IME/marked-text path, while Windows composes in the keyboard-layout driver and delivers one finished keypress. The direct Icelandic keys `þ æ ö ð` never broke. The 500 ms debounced refetch is not involved; it reproduces at a 0 ms inter-key delay too.

Shipped as a `pnpm patch` because the fix is in a dependency. It has two parts, because removing the stale `value` alone regresses — the input then keeps the selected label after picking an option, which is downshift's default `ItemClick` behaviour that the stale `value` had been masking:

1. drop `value: inputValue` from `getInputProps` in `Multiselect` and `DynamicMultiselect`
2. in the shared `useMultiselect` `stateReducer`, also return `inputValue: ""` on `ItemClick` / `InputKeyDownEnter`

Should also go upstream to `saleor/macaw-ui`, whose `main` still carries the same line, and the patch dropped once that releases.
