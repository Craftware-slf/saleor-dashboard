import { type Rule } from "@dashboard/discounts/models";
import {
  type PromotionDetailsFragment,
  PromotionTypeEnum,
  RewardValueTypeEnum,
} from "@dashboard/graphql";
import { act, renderHook } from "@testing-library/react";

import { useRulesHandlers } from "./useRulesHandlers";

const createPromotion = (collectionIds: string[]): PromotionDetailsFragment =>
  ({
    id: "promotion-1",
    type: PromotionTypeEnum.CATALOGUE,
    rules: [
      {
        id: "rule-1",
        name: "Rule 1",
        description: null,
        channels: [{ id: "channel-1", name: "Channel 1" }],
        rewardType: null,
        rewardValue: 10,
        rewardValueType: RewardValueTypeEnum.PERCENTAGE,
        giftIds: [],
        cataloguePredicate: { collectionPredicate: { ids: collectionIds } },
      },
    ],
  }) as unknown as PromotionDetailsFragment;

const labels: Record<string, string> = {
  "col-1": "Summer",
  "brand-1": "Brand: AXA",
};

// Stable references: the hook syncs the labels map in an effect keyed on its identity, as the
// details provider (a parent that does not re-render with the hook) does in the app.
const noLabels: Record<string, string> = {};
const noBrandCollectionIds: string[] = [];

const baseProps = {
  giftsOptionsDetailsMap: {},
  onRuleCreateSubmit: jest.fn(async () => []),
  onRuleUpdateSubmit: jest.fn(async () => []),
  onRuleDeleteSubmit: jest.fn(),
};

describe("DiscountDetailsForm useRulesHandlers - brand conditions", () => {
  it("should re-classify brand collections once their ids arrive", () => {
    // Arrange
    const data = createPromotion(["col-1", "brand-1"]);
    const { result, rerender } = renderHook(
      ({ brandCollectionIds }: { brandCollectionIds: string[] }) =>
        useRulesHandlers({
          ...baseProps,
          data,
          ruleConditionsOptionsDetailsMap: labels,
          brandCollectionIds,
        }),
      { initialProps: { brandCollectionIds: noBrandCollectionIds } },
    );

    // Assert - details still loading: everything is a collection
    expect(result.current.rules[0].conditions.map(condition => condition.id)).toEqual([
      "collection",
    ]);

    // Act
    rerender({ brandCollectionIds: ["brand-1"] });

    // Assert
    expect(result.current.rules[0].conditions).toEqual([
      { id: "collection", type: "is", value: [{ label: "Summer", value: "col-1" }] },
      { id: "brand", type: "is", value: [{ label: "Brand: AXA", value: "brand-1" }] },
    ]);
  });

  it("should load a just-submitted brand condition back as brand", async () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ data }: { data: PromotionDetailsFragment }) =>
        useRulesHandlers({
          ...baseProps,
          data,
          ruleConditionsOptionsDetailsMap: noLabels,
          brandCollectionIds: noBrandCollectionIds,
        }),
      { initialProps: { data: createPromotion([]) } },
    );
    const submittedRule = {
      id: "rule-1",
      name: "Rule 1",
      description: "",
      channel: { label: "Channel 1", value: "channel-1" },
      rewardType: null,
      rewardValue: 10,
      rewardValueType: RewardValueTypeEnum.PERCENTAGE,
      rewardGifts: [],
      conditions: [{ id: "brand", type: "is", value: [{ label: "Brand: AXA", value: "brand-1" }] }],
    } as Rule;

    // Act
    await act(async () => {
      await result.current.onRuleSubmit(submittedRule, 0);
    });
    // The API returns the saved rule as a plain collectionPredicate
    rerender({ data: createPromotion(["brand-1"]) });

    // Assert
    expect(result.current.rules[0].conditions).toEqual([
      { id: "brand", type: "is", value: [{ label: "Brand: AXA", value: "brand-1" }] },
    ]);
  });
});
