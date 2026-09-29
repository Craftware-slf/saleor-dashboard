import { OrderDirection, ProductOrderField } from "@dashboard/graphql";
import { type ProductListUrlQueryParams, ProductListUrlSortField } from "@dashboard/products/urls";

import { canBeSorted, getEffectiveSortField, getSortQueryVariables } from "./sort";
import { type SortAttributeIds } from "./sortAttributes";

const resolved: SortAttributeIds = {
  [ProductListUrlSortField.sku]: "QXR0cmlidXRlOjE=",
  [ProductListUrlSortField.category]: "QXR0cmlidXRlOjI=",
};

describe("canBeSorted — SKU / Category (FEAT-210)", () => {
  it("allows both once their sort attributes are resolved", () => {
    expect(canBeSorted(ProductListUrlSortField.sku, false, resolved)).toBe(true);
    expect(canBeSorted(ProductListUrlSortField.category, false, resolved)).toBe(true);
  });

  it("refuses both when the attributes don't exist on this instance", () => {
    expect(canBeSorted(ProductListUrlSortField.sku, true, {})).toBe(false);
    expect(canBeSorted(ProductListUrlSortField.category, true)).toBe(false);
  });

  it("gates each column on its own attribute", () => {
    const skuOnly: SortAttributeIds = { [ProductListUrlSortField.sku]: "QXR0cmlidXRlOjE=" };

    expect(canBeSorted(ProductListUrlSortField.sku, false, skuOnly)).toBe(true);
    expect(canBeSorted(ProductListUrlSortField.category, false, skuOnly)).toBe(false);
  });

  it("leaves the stock sorts unchanged", () => {
    expect(canBeSorted(ProductListUrlSortField.name, false)).toBe(true);
    expect(canBeSorted(ProductListUrlSortField.price, false, resolved)).toBe(false);
    expect(canBeSorted(ProductListUrlSortField.price, true)).toBe(true);
  });
});

describe("getEffectiveSortField", () => {
  it("keeps a resolved SKU sort", () => {
    expect(getEffectiveSortField(ProductListUrlSortField.sku, resolved)).toBe(
      ProductListUrlSortField.sku,
    );
  });

  it("degrades an unresolved SKU/Category sort to name", () => {
    expect(getEffectiveSortField(ProductListUrlSortField.sku, {})).toBe(
      ProductListUrlSortField.name,
    );
    expect(getEffectiveSortField(ProductListUrlSortField.category)).toBe(
      ProductListUrlSortField.name,
    );
  });

  it("never touches other sorts", () => {
    expect(getEffectiveSortField(ProductListUrlSortField.date, {})).toBe(
      ProductListUrlSortField.date,
    );
  });
});

describe("getSortQueryVariables", () => {
  const params = (sort: ProductListUrlSortField, asc: boolean): ProductListUrlQueryParams => ({
    sort,
    asc,
  });

  it("sorts SKU by the sort_sku attribute, ascending", () => {
    expect(
      getSortQueryVariables(params(ProductListUrlSortField.sku, true), false, resolved),
    ).toEqual({ attributeId: resolved.sku, direction: OrderDirection.ASC });
  });

  it("sorts Category by the sort_category attribute, descending", () => {
    expect(
      getSortQueryVariables(params(ProductListUrlSortField.category, false), false, resolved),
    ).toEqual({ attributeId: resolved.category, direction: OrderDirection.DESC });
  });

  it("falls back to a name sort, keeping the direction, when the attribute is missing", () => {
    expect(getSortQueryVariables(params(ProductListUrlSortField.sku, false), false, {})).toEqual({
      field: ProductOrderField.NAME,
      direction: OrderDirection.DESC,
    });
  });

  it("never sends an attributeId-less attribute sort", () => {
    const result = getSortQueryVariables(params(ProductListUrlSortField.category, true), true);

    expect(result).not.toHaveProperty("attributeId");
  });

  it("still maps the stock fields and the grid attribute sort", () => {
    expect(getSortQueryVariables(params(ProductListUrlSortField.name, true), false)).toEqual({
      field: ProductOrderField.NAME,
      direction: OrderDirection.ASC,
    });
    expect(
      getSortQueryVariables(
        { ...params(ProductListUrlSortField.attribute, true), attributeId: "attr-1" },
        false,
      ),
    ).toEqual({ attributeId: "attr-1", direction: OrderDirection.ASC });
  });
});
