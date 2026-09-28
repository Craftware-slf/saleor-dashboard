import { type Rule } from "@dashboard/discounts/models";

import { getCurrentBrandCollectionIds, getCurrentConditionsValuesLabels } from "./utils";

describe("getCurrentConditionsValuesLabels", () => {
  it("should return empty object if no rules", () => {
    expect(getCurrentConditionsValuesLabels([])).toEqual({});
  });
  it("should return empty object if no conditions", () => {
    expect(getCurrentConditionsValuesLabels([{ conditions: [] }] as unknown as Rule[])).toEqual({});
  });
  it("should return empty object if no values", () => {
    expect(
      getCurrentConditionsValuesLabels([{ conditions: [{ value: [] }] }] as unknown as Rule[]),
    ).toEqual({});
  });
  it("should return object with value as key and label as value", () => {
    expect(
      getCurrentConditionsValuesLabels([
        { conditions: [{ value: [{ value: "test", label: "test2" }] }] },
        { conditions: [{ value: [{ value: "test3", label: "test4" }] }] },
      ] as unknown as Rule[]),
    ).toEqual({ test: "test2", test3: "test4" });
  });
});

describe("getCurrentBrandCollectionIds", () => {
  it("should return empty array if no rules", () => {
    expect(getCurrentBrandCollectionIds([])).toEqual([]);
  });
  it("should return only ids picked in brand conditions", () => {
    // Arrange
    const rules = [
      {
        conditions: [
          { id: "collection", type: "is", value: [{ value: "col-1", label: "Summer" }] },
          { id: "brand", type: "is", value: [{ value: "brand-1", label: "Brand: AXA" }] },
        ],
      },
      {
        conditions: [
          { id: "brand", type: "is", value: [{ value: "brand-2", label: "Brand: Giant" }] },
          { id: "brand", type: "is", value: null },
        ],
      },
    ] as unknown as Rule[];

    // Act & Assert
    expect(getCurrentBrandCollectionIds(rules)).toEqual(["brand-1", "brand-2"]);
  });
});
