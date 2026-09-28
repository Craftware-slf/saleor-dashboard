import { DEFAULT_INITIAL_SEARCH_DATA } from "@dashboard/config";
import { isBrandCollection } from "@dashboard/discounts/brandCollections";
import { type CommonSearchOpts } from "@dashboard/hooks/makeTopLevelSearch/types";
import { getSearchFetchMoreProps } from "@dashboard/hooks/makeTopLevelSearch/utils";
import { useRuleConditionCollectionSearch } from "@dashboard/searches/useCollectionSearch";
import { mapEdgesToItems } from "@dashboard/utils/maps";

export const useCollectionOptions = (channel: string | null, conditionId: string | null) => {
  const {
    loadMore: loadMoreCollections,
    search: searchCollections,
    result: searchCollectionsOpts,
  } = useRuleConditionCollectionSearch({
    variables: {
      ...DEFAULT_INITIAL_SEARCH_DATA,
      channel,
    },
    skip: !channel || !conditionId || conditionId !== "collection",
  });
  const fetchMoreCollections = getSearchFetchMoreProps(
    searchCollectionsOpts as CommonSearchOpts,
    loadMoreCollections,
  );

  return {
    fetch: searchCollections,
    // hasMore still reflects the unfiltered page, so "load more" keeps working even when a
    // whole page consisted of brand collections.
    fetchMoreProps: fetchMoreCollections,
    // Brand collections have their own "Brands" condition; there is no negated metadata
    // filter in the API, so they are dropped client-side.
    options: (mapEdgesToItems(searchCollectionsOpts?.data?.search) ?? [])
      .filter(collection => !isBrandCollection(collection))
      .map(({ name, id }) => ({
        label: name,
        value: id,
      })),
  };
};
