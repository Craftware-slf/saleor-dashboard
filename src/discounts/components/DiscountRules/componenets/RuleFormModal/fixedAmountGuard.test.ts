import { type Rule } from "@dashboard/discounts/models";
import { type PromotionRuleFixedAmountPricesQuery, RewardValueTypeEnum } from "@dashboard/graphql";

import { directTargets, findWipedPrices, needsFixedAmountCheck } from "./fixedAmountGuard";

const rule = (overrides: Partial<Rule> = {}): Rule => ({
  id: "",
  name: "Singles Day",
  description: null,
  channel: { label: "Fífa", value: "CH:fifa" },
  rewardType: null,
  rewardValue: 40000,
  rewardValueType: RewardValueTypeEnum.FIXED,
  rewardGifts: [],
  conditions: [
    { id: "product", type: "is", value: [{ label: "Oxford", value: "P:1" }] },
    { id: "variant", type: "is", value: [{ label: "Seat", value: "V:9" }] },
    { id: "category", type: "is", value: [{ label: "Vagnar", value: "C:1" }] },
  ],
  ...overrides,
});

const listing = (slug: string, amount: number | null) => ({
  __typename: "ProductVariantChannelListing" as const,
  id: `L:${slug}`,
  channel: { __typename: "Channel" as const, id: `CH:${slug}`, slug },
  price: amount === null ? null : { __typename: "Money" as const, amount, currency: "ISK" },
});

const data = (
  products: Array<{
    name: string;
    variants: Array<{ name: string; prices: Array<[string, number | null]> }>;
  }>,
  variants: Array<{ name: string; product: string; prices: Array<[string, number | null]> }> = [],
): PromotionRuleFixedAmountPricesQuery => ({
  __typename: "Query",
  products: {
    __typename: "ProductCountableConnection",
    edges: products.map((p, i) => ({
      __typename: "ProductCountableEdge",
      node: {
        __typename: "Product",
        id: `P:${i}`,
        name: p.name,
        variants: p.variants.map((v, j) => ({
          __typename: "ProductVariant",
          id: `PV:${i}:${j}`,
          name: v.name,
          channelListings: v.prices.map(([slug, amount]) => listing(slug, amount)),
        })),
      },
    })),
  },
  productVariants: {
    __typename: "ProductVariantCountableConnection",
    edges: variants.map((v, i) => ({
      __typename: "ProductVariantCountableEdge",
      node: {
        __typename: "ProductVariant",
        id: `V:${i}`,
        name: v.name,
        product: { __typename: "Product", id: `P:${v.product}`, name: v.product },
        channelListings: v.prices.map(([slug, amount]) => listing(slug, amount)),
      },
    })),
  },
});

describe("fixedAmountGuard (Örninn FEAT-251)", () => {
  it("checks only catalogue rules taking a fixed amount off, with a channel", () => {
    expect(needsFixedAmountCheck(rule())).toBe(true);
    expect(needsFixedAmountCheck(rule({ rewardValueType: RewardValueTypeEnum.PERCENTAGE }))).toBe(
      false,
    );
    expect(needsFixedAmountCheck(rule({ channel: null }))).toBe(false);
    expect(needsFixedAmountCheck(rule({ rewardValue: null }))).toBe(false);
  });

  it("collects the products and variants a rule names directly, not categories", () => {
    expect(directTargets(rule())).toEqual({ productIds: ["P:1"], variantIds: ["V:9"] });
  });

  it("flags a price the amount would take entirely, in the rule's channel only", () => {
    const result = data([
      { name: "Oxford Kerra + Sense", variants: [{ name: "", prices: [["fifa", 126980]] }] },
      {
        name: "Snuð",
        variants: [
          {
            name: "",
            prices: [
              ["fifa", 1990],
              ["hjol", 99999],
            ],
          },
        ],
      },
    ]);

    expect(findWipedPrices(result, "fifa", 40000)).toEqual([
      { name: "Snuð", amount: 1990, currency: "ISK" },
    ]);
    expect(findWipedPrices(result, "fifa", 126980)).toHaveLength(2);
  });

  it("names the variant when a product has several, and skips unpriced ones", () => {
    const result = data(
      [
        {
          name: "Hjálmur",
          variants: [
            { name: "S", prices: [["fifa", 9990]] },
            { name: "L", prices: [["fifa", 59990]] },
            { name: "XL", prices: [["fifa", null]] },
          ],
        },
      ],
      [{ name: "Grár", product: "Sæti", prices: [["fifa", 0]] }],
    );

    expect(findWipedPrices(result, "fifa", 10000)).toEqual([
      { name: "Hjálmur (S)", amount: 9990, currency: "ISK" },
    ]);
  });
});
