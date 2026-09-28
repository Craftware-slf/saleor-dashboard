import { type CataloguePredicateAPI } from "@dashboard/discounts/types";

import { prepareCatalogueRuleConditions } from "./prepareConditions";

describe("prepareCataloguePredicate", () => {
  it("should return empty array when cataloguePredicate is empty", () => {
    const cataloguePredicate = {};
    const result = prepareCatalogueRuleConditions(cataloguePredicate, {});

    expect(result).toEqual([]);
  });
  it("should return array of conditions when cataloguePredicate is not empty", () => {
    const cataloguePredicate = {
      OR: [
        {
          collectionPredicate: {
            ids: ["1"],
          },
        },
        {
          productPredicate: {
            ids: ["2"],
          },
          AND: [
            {
              collectionPredicate: {
                ids: ["3"],
              },
            },
            {
              productPredicate: {
                giftCard: true,
              },
            },
          ],
        },
      ],
    } as CataloguePredicateAPI;
    const result = prepareCatalogueRuleConditions(cataloguePredicate, {});

    expect(result).toEqual([
      {
        id: "collection",
        type: "is",
        value: [{ label: "1", value: "1" }],
      },
      {
        id: "product",
        type: "is",
        value: [{ label: "2", value: "2" }],
      },
      {
        id: "collection",
        type: "is",
        value: [{ label: "3", value: "3" }],
      },
      {
        id: "product",
        type: "is",
        value: [],
      },
    ]);
  });
});

describe("prepareCatalogueRuleConditions - brand collections", () => {
  const labels: Record<string, string> = {
    "col-1": "Summer",
    "brand-1": "Brand: AXA",
    "brand-2": "Brand: Giant",
  };

  it("should load a collectionPredicate of brand collections as a brand condition", () => {
    // Arrange
    const predicate: CataloguePredicateAPI = {
      collectionPredicate: { ids: ["brand-1", "brand-2"] },
    };

    // Act
    const result = prepareCatalogueRuleConditions(predicate, labels, ["brand-1", "brand-2"]);

    // Assert
    expect(result).toEqual([
      {
        id: "brand",
        type: "is",
        value: [
          { label: "Brand: AXA", value: "brand-1" },
          { label: "Brand: Giant", value: "brand-2" },
        ],
      },
    ]);
  });
  it("should split a collectionPredicate mixing brand and regular ids into two conditions", () => {
    // Arrange
    const predicate: CataloguePredicateAPI = {
      collectionPredicate: { ids: ["brand-1", "col-1", "brand-2"] },
    };

    // Act
    const result = prepareCatalogueRuleConditions(predicate, labels, ["brand-1", "brand-2"]);

    // Assert
    expect(result).toEqual([
      {
        id: "collection",
        type: "is",
        value: [{ label: "Summer", value: "col-1" }],
      },
      {
        id: "brand",
        type: "is",
        value: [
          { label: "Brand: AXA", value: "brand-1" },
          { label: "Brand: Giant", value: "brand-2" },
        ],
      },
    ]);
  });
  it("should load OR-ed brand and collection predicates as brand and collection conditions", () => {
    // Arrange
    const predicate: CataloguePredicateAPI = {
      OR: [
        { collectionPredicate: { ids: ["col-1"] } },
        { collectionPredicate: { ids: ["brand-1"] } },
        { productPredicate: { ids: ["prod-1"] } },
      ],
    };

    // Act
    const result = prepareCatalogueRuleConditions(predicate, labels, ["brand-1"]);

    // Assert
    expect(result).toEqual([
      { id: "collection", type: "is", value: [{ label: "Summer", value: "col-1" }] },
      { id: "brand", type: "is", value: [{ label: "Brand: AXA", value: "brand-1" }] },
      { id: "product", type: "is", value: [{ label: "prod-1", value: "prod-1" }] },
    ]);
  });
  it("should treat collections as regular while brand ids are not known yet", () => {
    // Arrange
    const predicate: CataloguePredicateAPI = {
      collectionPredicate: { ids: ["brand-1"] },
    };

    // Act
    const result = prepareCatalogueRuleConditions(predicate, {});

    // Assert
    expect(result).toEqual([
      { id: "collection", type: "is", value: [{ label: "brand-1", value: "brand-1" }] },
    ]);
  });
  it("should keep an empty collectionPredicate as an empty collection condition", () => {
    // Arrange
    const predicate: CataloguePredicateAPI = { collectionPredicate: { ids: [] } };

    // Act & Assert
    expect(prepareCatalogueRuleConditions(predicate, labels, ["brand-1"])).toEqual([
      { id: "collection", type: "is", value: [] },
    ]);
  });
});
