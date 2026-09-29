import { ProductListUrlSortField } from "@dashboard/products/urls";

import {
  isAttributeSortField,
  mapSortAttributeIds,
  PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS,
} from "./sortAttributes";

describe("PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS", () => {
  it("matches the slugs the orninn sync worker maintains", () => {
    // Renaming either side breaks the sort silently (the column just stops being sortable).
    expect(PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS).toEqual({
      sku: "sort_sku",
      category: "sort_category",
    });
  });
});

describe("mapSortAttributeIds", () => {
  it("maps each slug onto its sort field", () => {
    expect(
      mapSortAttributeIds([
        { id: "cat-id", slug: "sort_category" },
        { id: "sku-id", slug: "sort_sku" },
      ]),
    ).toEqual({ sku: "sku-id", category: "cat-id" });
  });

  it("leaves a missing attribute out rather than mapping it to undefined", () => {
    const ids = mapSortAttributeIds([{ id: "sku-id", slug: "sort_sku" }]);

    expect(ids).toEqual({ sku: "sku-id" });
    expect(ids).not.toHaveProperty("category");
  });

  it("ignores unrelated attributes", () => {
    expect(mapSortAttributeIds([{ id: "x", slug: "sort_something_else" }])).toEqual({});
  });
});

describe("isAttributeSortField", () => {
  it("is true only for the SKU and Category sorts", () => {
    expect(isAttributeSortField(ProductListUrlSortField.sku)).toBe(true);
    expect(isAttributeSortField(ProductListUrlSortField.category)).toBe(true);
    expect(isAttributeSortField(ProductListUrlSortField.attribute)).toBe(false);
    expect(isAttributeSortField(ProductListUrlSortField.name)).toBe(false);
    expect(isAttributeSortField(undefined)).toBe(false);
  });
});
