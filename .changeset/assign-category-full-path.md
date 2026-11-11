---
"saleor-dashboard": minor
---

Show the full category path in every category picker (Örninn FEAT-263).

Category names repeat across Örninn's three shop trees ("Shoes", "Kids", "Clothing"), so a bare name doesn't tell staff which category they are picking. Every category picker now shows the full path, root first, with no `...`, e.g. `Örninn Golf Shop / Clothing / Men's Golf Apparel / Shoes`:

- **Assign Category dialog** for category reference attributes (product, variant and model, create and edit): muted path before the name in each row. The chips show the same path right after assigning and after a reload (saved references are looked up by id).
- **Organize Product → Category** and **Category per store** (FEAT-185): the dropdown prefix is now the full path instead of `Root / ... / Parent /`.
- **Vouchers → Assign categories**: same dialog, now with the path.
- **Promotion rule condition "Category"** and **conditional discount → Categories**: options and saved values read as paths.
- **Navigation → menu item → Link → Category**: options, and an existing item's linked category when editing it.
- **Products list → Filters → Category**, the export filters, and filters on category reference attributes: options and chips restored from the URL read as paths (replacing FEAT-083's `name · slug`).
- **Global search and Cmd-K**: category results read `Root / Parent / Name`, path muted.

How: a `CategoryPath` fragment (aliased `fullPath: ancestors(first: 50) { id name level }`) is spread into each of those queries, and `src/categories/utils/categoryPath.ts` builds the label. Ancestors are sorted by `level`, because Saleor can return them in ID order after a category has been re-parented. `AssignContainerDialog` gets an optional `renderLabel` prop; the collection and model dialogs that share it are unchanged.
