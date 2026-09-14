import { useProductIdsBySkuQuery } from "@dashboard/graphql";
import { useMemo } from "react";

/**
 * How many variants the fallback lookup reads. A SKU fragment can be shared by a
 * whole family of variants, and the list below is turned into a product-id
 * filter, so this is the ceiling on how many products the fallback can surface.
 */
export const SKU_FALLBACK_VARIANT_LIMIT = 100;

/**
 * Shortest fragment worth a fallback lookup. Below this the ILIKE matches most
 * of the catalogue and the result is noise — the same floor the storefront's
 * Meilisearch fragments use (SKU_FRAGMENT_MIN_LENGTH in @orninn/types).
 */
const MIN_FRAGMENT_LENGTH = 4;

/**
 * A query is "SKU-shaped" when it is one unbroken run of SKU characters —
 * digits, ASCII letters and the "/" "-" separators BC uses — and carries at
 * least two digits. That admits "45087", "27364", "JP84039" and "0100627364/36"
 * while rejecting ordinary product-name searches like "hjol" or "dekk 28",
 * which the primary full-text search already handles better than an ILIKE would.
 */
export function isSkuShapedQuery(query: string | undefined): query is string {
  if (!query) {
    return false;
  }

  const trimmed = query.trim();

  if (trimmed.length < MIN_FRAGMENT_LENGTH) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, "").length;

  return digits >= 2 && /^[A-Za-z0-9/-]+$/.test(trimmed);
}

interface UseSkuFallbackSearchOpts {
  /** The raw search term from the list's `query` URL param. */
  query: string | undefined;
  /** Channel slug the list is scoped to, if any. */
  channel: string | undefined;
  /**
   * Only run when the primary search actually came back empty. The fallback is
   * strictly a rescue for a query that already failed, so it can never reorder
   * or dilute a result set that worked.
   */
  enabled: boolean;
}

interface SkuFallbackSearch {
  /** Ids of products owning a variant whose SKU contains the fragment. */
  productIds: string[];
  loading: boolean;
  /** True while the fallback is actually in play, for callers that want to say so. */
  active: boolean;
}

/**
 * Resolves a SKU fragment to the ids of the products owning a matching variant.
 *
 * Used by the product list to rescue a search the Postgres full-text index
 * cannot answer — see the docstring on `productIdsBySkuQuery` for why the two
 * mechanisms differ.
 */
export const useSkuFallbackSearch = ({
  query,
  channel,
  enabled,
}: UseSkuFallbackSearchOpts): SkuFallbackSearch => {
  const shouldRun = enabled && isSkuShapedQuery(query);
  const { data, loading } = useProductIdsBySkuQuery({
    variables: {
      query: (query ?? "").trim(),
      channel,
      first: SKU_FALLBACK_VARIANT_LIMIT,
    },
    skip: !shouldRun,
    fetchPolicy: "cache-and-network",
  });

  const productIds = useMemo(() => {
    if (!shouldRun) {
      return [];
    }

    const ids = (data?.productVariants?.edges ?? [])
      .map(edge => edge.node.product.id)
      .filter((id): id is string => !!id);

    // Several variants of one product routinely share a fragment.
    return Array.from(new Set(ids));
  }, [data, shouldRun]);

  return {
    productIds,
    // `loading` stays false when the query is skipped, so the list never waits
    // on a lookup it is not going to make.
    loading: shouldRun && loading,
    active: shouldRun,
  };
};
