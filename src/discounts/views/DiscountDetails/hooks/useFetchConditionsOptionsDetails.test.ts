import {
  type PromotionDetailsQuery,
  type RuleConditionsSelectedOptionsDetailsQuery,
} from "@dashboard/graphql";

import {
  getAllConditionsOptionsIdsToFetch,
  getBrandCollectionIds,
  getRuleConditionsOptionsDetailsMap,
} from "./useFetchConditionsOptionsDetails";

describe("getAllConditionsOptionsIdsToFetch", () => {
  it("should return initAllConditionsIds if promotionData is undefined", () => {
    expect(getAllConditionsOptionsIdsToFetch(undefined)).toEqual({
      productsIds: [],
      categoriesIds: [],
      collectionsIds: [],
      variantsIds: [],
    });
  });
  it("should return product ids", () => {
    expect(
      getAllConditionsOptionsIdsToFetch({
        promotion: {
          rules: [
            { cataloguePredicate: { productPredicate: { ids: ["1", "2"] } } },
            { cataloguePredicate: { productPredicate: { ids: ["3", "4"] } } },
            {
              cataloguePredicate: {
                OR: [
                  { productPredicate: { ids: ["5", "6"] } },
                  { categoryPredicate: { ids: ["7", "8"] } },
                  { collectionPredicate: { ids: ["9", "10"] } },
                ],
              },
            },
            { cataloguePredicate: { variantPredicate: { ids: ["22", "23"] } } },
          ],
        },
      } as PromotionDetailsQuery),
    ).toEqual({
      categoriesIds: ["7", "8"],
      collectionsIds: ["9", "10"],
      productsIds: ["1", "2", "3", "4", "5", "6"],
      variantsIds: ["22", "23"],
    });
  });
});
describe("getRuleConditionsOptionsDetailsMap", () => {
  it("should return empty object if data is undefined", () => {
    expect(getRuleConditionsOptionsDetailsMap(undefined)).toEqual({});
  });
  it("should return product options details map", () => {
    expect(
      getRuleConditionsOptionsDetailsMap({
        products: {
          edges: [
            {
              node: {
                id: "1",
                name: "product 1",
              },
            },
            {
              node: {
                id: "2",
                name: "product 2",
              },
            },
          ],
        },
        categories: {
          edges: [
            {
              node: {
                id: "11",
                name: "category 1",
              },
            },
            {
              node: {
                id: "22",
                name: "category 2",
              },
            },
          ],
        },
        collections: {
          edges: [
            {
              node: {
                id: "111",
                name: "collection 1",
              },
            },
            {
              node: {
                id: "222",
                name: "collection 2",
              },
            },
          ],
        },
        productVariants: {
          edges: [
            {
              node: {
                id: "1111",
                name: "variant 1",
              },
            },
            {
              node: {
                id: "2222",
                name: "variant 2",
              },
            },
          ],
        },
      } as RuleConditionsSelectedOptionsDetailsQuery),
    ).toEqual({
      "1": "product 1",
      "2": "product 2",
      "11": "category 1",
      "22": "category 2",
      "111": "collection 1",
      "222": "collection 2",
      "1111": "variant 1",
      "2222": "variant 2",
    });
  });
});

describe("getAllConditionsOptionsIdsToFetch - accumulator", () => {
  it("should not leak ids from a previous call", () => {
    // Arrange
    getAllConditionsOptionsIdsToFetch({
      promotion: {
        rules: [{ cataloguePredicate: { collectionPredicate: { ids: ["brand-1"] } } }],
      },
    } as PromotionDetailsQuery);

    // Act & Assert
    expect(getAllConditionsOptionsIdsToFetch(undefined)).toEqual({
      productsIds: [],
      categoriesIds: [],
      collectionsIds: [],
      variantsIds: [],
    });
  });
});

describe("getBrandCollectionIds", () => {
  it("should return empty array if data is undefined", () => {
    expect(getBrandCollectionIds(undefined)).toEqual([]);
  });
  it("should return ids of collections with brand_page_id metadata only", () => {
    // Arrange
    const data = {
      collections: {
        edges: [
          { node: { id: "col-1", name: "Summer", brandPageId: null } },
          { node: { id: "brand-1", name: "Brand: AXA", brandPageId: "UGFnZTox" } },
          { node: { id: "brand-2", name: "Brand: Giant", brandPageId: "UGFnZToy" } },
        ],
      },
    } as RuleConditionsSelectedOptionsDetailsQuery;

    // Act & Assert
    expect(getBrandCollectionIds(data)).toEqual(["brand-1", "brand-2"]);
  });
});
