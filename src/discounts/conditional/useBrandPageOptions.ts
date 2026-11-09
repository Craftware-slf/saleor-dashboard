import { DEFAULT_INITIAL_SEARCH_DATA } from "@dashboard/config";
import { BRAND_COLLECTION_METADATA_KEY } from "@dashboard/discounts/brandCollections";
import { type CommonSearchOpts } from "@dashboard/hooks/makeTopLevelSearch/types";
import { getSearchFetchMoreProps } from "@dashboard/hooks/makeTopLevelSearch/utils";
import { useRuleConditionCollectionSearch } from "@dashboard/searches/useCollectionSearch";
import { mapEdgesToItems } from "@dashboard/utils/maps";

interface BrandPageOptions {
  fetch: (query: string) => void;
  fetchMoreProps: ReturnType<typeof getSearchFetchMoreProps>;
  options: Array<{ label: string; value: string }>;
}

/** "Brand: Titleist" → "Titleist" (the sync worker names brand collections that way). */
export const brandTitleOf = (collectionName: string): string =>
  collectionName.replace(/^Brand:\s*/, "");

/**
 * Options for the conditional discount's Brands picker (FEAT-257). Brands are listed
 * through their brand collections (FEAT-206 — one per brand in use, marked with
 * `brand_page_id`), but the option VALUE is the brand Page id: the storefront matches a
 * conditional rule on the product's `brand` reference attribute, not on the collection,
 * so the rule never depends on the collection sync having caught up.
 */
export const useBrandPageOptions = (channel: string | null): BrandPageOptions => {
  const { loadMore, search, result } = useRuleConditionCollectionSearch({
    variables: {
      ...DEFAULT_INITIAL_SEARCH_DATA,
      filter: { metadata: [{ key: BRAND_COLLECTION_METADATA_KEY }] },
    },
    skip: !channel,
  });

  return {
    fetch: search,
    fetchMoreProps: getSearchFetchMoreProps(result as CommonSearchOpts, loadMore),
    options: (mapEdgesToItems(result?.data?.search) ?? []).flatMap(({ name, brandPageId }) =>
      brandPageId ? [{ label: brandTitleOf(name), value: brandPageId }] : [],
    ),
  };
};
