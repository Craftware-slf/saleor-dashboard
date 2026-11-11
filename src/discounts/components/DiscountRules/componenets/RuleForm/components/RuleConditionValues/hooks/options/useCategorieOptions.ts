import { getCategoryPathLabel } from "@dashboard/categories/utils/categoryPath";
import { DEFAULT_INITIAL_SEARCH_DATA } from "@dashboard/config";
import { type CommonSearchOpts } from "@dashboard/hooks/makeTopLevelSearch/types";
import { getSearchFetchMoreProps } from "@dashboard/hooks/makeTopLevelSearch/utils";
import useCategorySearch from "@dashboard/searches/useCategorySearch";
import { mapEdgesToItems } from "@dashboard/utils/maps";

export const useCategorieOptions = (channel: string | null, conditionId: string | null) => {
  const {
    loadMore: loadMoreCategories,
    search: searchCategories,
    result: searchCategoriesOpts,
  } = useCategorySearch({
    variables: {
      after: DEFAULT_INITIAL_SEARCH_DATA.after,
      first: DEFAULT_INITIAL_SEARCH_DATA.first,
      filter: undefined,
    },
    skip: !channel || !conditionId || conditionId !== "category",
  });
  const fetchMoreCategories = getSearchFetchMoreProps(
    searchCategoriesOpts as CommonSearchOpts,
    loadMoreCategories,
  );

  return {
    fetch: searchCategories,
    fetchMoreProps: fetchMoreCategories,
    // Craftware (Örninn FEAT-263): full path, so same-named categories in different shops differ.
    options: (mapEdgesToItems(searchCategoriesOpts?.data?.search) ?? []).map(category => ({
      label: getCategoryPathLabel(category),
      value: category.id,
    })),
  };
};
