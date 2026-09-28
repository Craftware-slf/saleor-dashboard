import { type Condition } from "../Condition";
import { prepareCataloguePredicate } from "./preparePredicate";

describe("prepareCataloguePredicate", () => {
  it("should return empty object when conditions are empty", () => {
    const conditions: Condition[] = [];
    const result = prepareCataloguePredicate(conditions);

    expect(result).toEqual({});
  });
  it("should return object with filtered conditions", () => {
    const conditions = [
      {
        id: "",
        type: "is",
        value: null,
      },
      {
        id: "product",
        type: "is",
        value: [],
      },
      {
        id: "category",
        type: "is",
        value: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
        ],
      },
      {
        id: "collection",
        type: "is",
        value: [
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
    ] as Condition[];
    const result = prepareCataloguePredicate(conditions);

    expect(result).toEqual({
      OR: [
        {
          categoryPredicate: {
            ids: ["1", "2"],
          },
        },
        {
          collectionPredicate: {
            ids: ["3", "4"],
          },
        },
      ],
    });
  });
});

describe("prepareCataloguePredicate - brand condition", () => {
  it("should save a brand condition as a plain collectionPredicate", () => {
    // Arrange
    const conditions: Condition[] = [
      {
        id: "brand",
        type: "is",
        value: [
          { label: "Brand: AXA", value: "brand-1" },
          { label: "Brand: Giant", value: "brand-2" },
        ],
      },
    ];

    // Act
    const result = prepareCataloguePredicate(conditions);

    // Assert
    expect(result).toEqual({ collectionPredicate: { ids: ["brand-1", "brand-2"] } });
    expect(result).not.toHaveProperty("brandPredicate");
  });
  it("should OR brand and collection conditions as two collectionPredicates", () => {
    // Arrange
    const conditions: Condition[] = [
      { id: "collection", type: "is", value: [{ label: "Summer", value: "col-1" }] },
      { id: "brand", type: "is", value: [{ label: "Brand: AXA", value: "brand-1" }] },
      { id: "product", type: "is", value: [{ label: "Bike", value: "prod-1" }] },
    ];

    // Act
    const result = prepareCataloguePredicate(conditions);

    // Assert
    expect(result).toEqual({
      OR: [
        { collectionPredicate: { ids: ["col-1"] } },
        { collectionPredicate: { ids: ["brand-1"] } },
        { productPredicate: { ids: ["prod-1"] } },
      ],
    });
  });
  it("should skip an empty brand condition", () => {
    // Arrange
    const conditions: Condition[] = [
      { id: "brand", type: "is", value: [] },
      { id: "category", type: "is", value: [{ label: "Bikes", value: "cat-1" }] },
    ];

    // Act & Assert
    expect(prepareCataloguePredicate(conditions)).toEqual({
      categoryPredicate: { ids: ["cat-1"] },
    });
  });
});
