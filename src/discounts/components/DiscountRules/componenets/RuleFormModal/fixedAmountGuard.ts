import { useApolloClient } from "@apollo/client";
import { isArrayOfOptions, type Rule } from "@dashboard/discounts/models";
import {
  type ChannelFragment,
  PromotionRuleFixedAmountPricesDocument,
  type PromotionRuleFixedAmountPricesQuery,
  type PromotionRuleFixedAmountPricesQueryVariables,
  RewardValueTypeEnum,
} from "@dashboard/graphql";
import { useCallback } from "react";

/** A price a fixed-amount rule would wipe out: the amount is at least as large as it. */
interface WipedPrice {
  name: string;
  amount: number;
  currency: string;
}

type Listing = {
  channel: { slug: string };
  price: { amount: number; currency: string } | null;
};

/** Ids the rule names directly, by condition type ("product" / "variant"). */
export const directTargets = (rule: Rule): { productIds: string[]; variantIds: string[] } => {
  const ids = (type: string): string[] =>
    rule.conditions.flatMap(c =>
      c.id === type && isArrayOfOptions(c.value) ? c.value.map(o => String(o.value)) : [],
    );

  return { productIds: ids("product"), variantIds: ids("variant") };
};

/** Does this rule need the check: a catalogue rule taking a fixed amount off, in a channel. */
export const needsFixedAmountCheck = (rule: Rule): boolean =>
  rule.rewardType === null &&
  rule.rewardValueType === RewardValueTypeEnum.FIXED &&
  typeof rule.rewardValue === "number" &&
  rule.rewardValue > 0 &&
  rule.channel !== null;

/**
 * Every priced variant (named directly, or through its product) whose price in the channel the
 * fixed amount would take entirely. Saleor floors such a price at 0, so the product sells free —
 * and for an Örninn bundle the storefront ignores the discount instead. Unpriced variants are
 * skipped: there is nothing to compare against.
 */
export const findWipedPrices = (
  data: PromotionRuleFixedAmountPricesQuery,
  channelSlug: string,
  amount: number,
): WipedPrice[] => {
  const priceIn = (listings: Listing[] | null | undefined): Listing["price"] =>
    (listings ?? []).find(l => l.channel.slug === channelSlug)?.price ?? null;
  const wiped: WipedPrice[] = [];
  const add = (name: string, price: Listing["price"]): void => {
    if (price !== null && price.amount > 0 && amount >= price.amount) {
      wiped.push({ name, amount: price.amount, currency: price.currency });
    }
  };

  for (const { node } of data.products?.edges ?? []) {
    const variants = node.variants ?? [];

    for (const v of variants) {
      add(
        variants.length > 1 && v.name ? `${node.name} (${v.name})` : node.name,
        priceIn(v.channelListings),
      );
    }
  }

  for (const { node } of data.productVariants?.edges ?? []) {
    add(
      node.name ? `${node.product.name} (${node.name})` : node.product.name,
      priceIn(node.channelListings),
    );
  }

  return wiped;
};

/**
 * Örninn FEAT-251: before a fixed-amount catalogue rule is saved, look up the prices of the
 * products and variants it names and return those the amount would wipe out (empty = fine).
 * Categories and collections are not expanded. A failed lookup returns no problem rather than
 * blocking the save.
 */
export const useFixedAmountGuard = (
  channels: ChannelFragment[],
): ((rule: Rule) => Promise<WipedPrice[]>) => {
  const client = useApolloClient();

  return useCallback(
    async (rule: Rule): Promise<WipedPrice[]> => {
      if (!needsFixedAmountCheck(rule)) {
        return [];
      }

      const channelSlug = channels.find(c => c.id === rule.channel?.value)?.slug;
      const { productIds, variantIds } = directTargets(rule);

      if (!channelSlug || (productIds.length === 0 && variantIds.length === 0)) {
        return [];
      }

      try {
        const { data } = await client.query<
          PromotionRuleFixedAmountPricesQuery,
          PromotionRuleFixedAmountPricesQueryVariables
        >({
          query: PromotionRuleFixedAmountPricesDocument,
          fetchPolicy: "network-only",
          variables: {
            channel: channelSlug,
            productIds,
            variantIds,
            hasProducts: productIds.length > 0,
            hasVariants: variantIds.length > 0,
          },
        });

        return findWipedPrices(data, channelSlug, rule.rewardValue ?? 0);
      } catch {
        return [];
      }
    },
    [channels, client],
  );
};
