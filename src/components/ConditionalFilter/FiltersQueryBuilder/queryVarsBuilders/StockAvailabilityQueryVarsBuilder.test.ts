import { StockAvailability } from "@dashboard/graphql";

import { BooleanValuesHandler } from "../../API/Handler";
import { CONSTRAINTS, STATIC_CONDITIONS, STATIC_PRODUCT_OPTIONS } from "../../constants";
import { Condition } from "../../FilterElement/Condition";
import { type ConditionItem, ConditionOptions } from "../../FilterElement/ConditionOptions";
import { ConditionSelected } from "../../FilterElement/ConditionSelected";
import { ExpressionValue, FilterElement } from "../../FilterElement/FilterElement";
import { StockAvailabilityQueryVarsBuilder } from "./StockAvailabilityQueryVarsBuilder";

describe("StockAvailabilityQueryVarsBuilder", () => {
  const def = new StockAvailabilityQueryVarsBuilder();
  const value = new ExpressionValue("stockAvailability", "Stock availability", "stockAvailability");
  const options = ConditionOptions.fromName("stockAvailability");
  const conditionItem: ConditionItem = { type: "select", label: "is", value: "input-1" };

  const elementWith = (selectedValue: string) => {
    const selected = ConditionSelected.fromConditionItemAndValue(conditionItem, {
      label: selectedValue === StockAvailability.OUT_OF_STOCK ? "Out of stock" : "In stock",
      value: selectedValue,
      slug: selectedValue,
    });

    return new FilterElement(value, new Condition(options, selected, false), false);
  };

  describe("canHandle", () => {
    it("should return true for elements with value 'stockAvailability'", () => {
      expect(def.canHandle(elementWith(StockAvailability.OUT_OF_STOCK))).toBe(true);
    });

    it("should return false for other values", () => {
      const other = new FilterElement(
        new ExpressionValue("isPublished", "IsPublished", "isPublished"),
        Condition.createEmpty(),
        false,
      );

      expect(def.canHandle(other)).toBe(false);
    });
  });

  describe("createOptionFetcher", () => {
    it("should offer exactly the two stock states with readable labels", async () => {
      const fetched = await def.createOptionFetcher().fetch();

      expect(def.createOptionFetcher()).toBeInstanceOf(BooleanValuesHandler);
      expect(fetched.map(o => o.value)).toEqual([
        StockAvailability.IN_STOCK,
        StockAvailability.OUT_OF_STOCK,
      ]);
      // Staff must not be shown the raw enum spelling.
      expect(fetched.map(o => o.label)).toEqual(["In stock", "Out of stock"]);
    });
  });

  describe("query updates (both APIs)", () => {
    it("should emit the bare enum for the WHERE API, not an { eq } wrapper", () => {
      const result = def.updateWhereQueryVariables({}, elementWith(StockAvailability.OUT_OF_STOCK));

      expect(result).toEqual({ stockAvailability: StockAvailability.OUT_OF_STOCK });
    });

    it("should emit the same shape for the FILTER API", () => {
      const result = def.updateFilterQueryVariables({}, elementWith(StockAvailability.IN_STOCK));

      expect(result).toEqual({ stockAvailability: StockAvailability.IN_STOCK });
    });

    it("should preserve other keys already on the query", () => {
      const result = def.updateWhereQueryVariables(
        { stockAvailability: undefined, ...{ isPublished: true } },
        elementWith(StockAvailability.OUT_OF_STOCK),
      );

      expect(result).toMatchObject({
        isPublished: true,
        stockAvailability: StockAvailability.OUT_OF_STOCK,
      });
    });

    it("should not add the key at all when nothing is selected", () => {
      const empty = new FilterElement(value, Condition.createEmpty(), false);
      const result = def.updateWhereQueryVariables({}, empty);

      expect(result.stockAvailability).toBeUndefined();
    });
  });

  describe("wiring that the builder depends on", () => {
    // These live in constants.ts, but a regression there silently disables this filter,
    // and the failure shows up only as an empty dropdown in the browser.
    it("should be offered as a product filter field", () => {
      expect(STATIC_PRODUCT_OPTIONS.map(o => o.value)).toContain("stockAvailability");
    });

    it("should have an 'is' condition defined", () => {
      expect(STATIC_CONDITIONS.stockAvailability).toEqual([
        { type: "select", label: "is", value: "input-1" },
      ]);
    });

    it("should force a channel, because Saleor rejects a channel-less stockAvailability query", () => {
      expect(CONSTRAINTS.channel.dependsOn).toContain("stockAvailability");
    });
  });
});
