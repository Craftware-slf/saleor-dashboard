import { DEFAULT_INITIAL_SEARCH_DATA } from "@dashboard/config";
import {
  BRAND_COLLECTION_METADATA_KEY,
  isBrandCollection,
} from "@dashboard/discounts/brandCollections";
import { type CommonSearchOpts } from "@dashboard/hooks/makeTopLevelSearch/types";
import { getSearchFetchMoreProps } from "@dashboard/hooks/makeTopLevelSearch/utils";
import { useRuleConditionCollectionSearch } from "@dashboard/searches/useCollectionSearch";
import { mapEdgesToItems } from "@dashboard/utils/maps";

/**
 * Options for the "Brands" rule condition: brand collections, i.e. collections carrying the
 * `brand_page_id` metadata key. Brand collections have no channel listings, so the search
 * deliberately does NOT pass the rule's channel (a channel-scoped query returns none of them).
 * The channel is still required before searching, like every other catalogue condition.
 */
export const useBrandOptions = (channel: string | null, conditionId: string | null) => {
  const {
    loadMore: loadMoreBrands,
    search: searchBrands,
    result: searchBrandsOpts,
  } = useRuleConditionCollectionSearch({
    variables: {
      ...DEFAULT_INITIAL_SEARCH_DATA,
      filter: {
        metadata: [{ key: BRAND_COLLECTION_METADATA_KEY }],
      },
    },
    skip: !channel || !conditionId || conditionId !== "brand",
  });
  const fetchMoreBrands = getSearchFetchMoreProps(
    searchBrandsOpts as CommonSearchOpts,
    loadMoreBrands,
  );

  return {
    fetch: searchBrands,
    fetchMoreProps: fetchMoreBrands,
    options: (mapEdgesToItems(searchBrandsOpts?.data?.search) ?? [])
      .filter(isBrandCollection)
      .map(({ name, id }) => ({
        label: name,
        value: id,
      })),
  };
};
