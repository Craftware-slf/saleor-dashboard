import { AttributeEntityTypeEnum, useSearchCategoriesQuery } from "@dashboard/graphql";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import { useMemo } from "react";

import { getCategoryPathLabel } from "./categoryPath";

// Saleor's connection limit; an entity referencing more categories than this would fall back to
// bare names for the rest, which is the pre-FEAT-263 behaviour, not an error.
const MAX_IDS = 100;

/**
 * Craftware (Örninn FEAT-263): full-path labels ("Root / Parent / Name") looked up by category id,
 * for places that only hold a saved id + bare name (reference-attribute chips, a menu item's link).
 */
export const useCategoryPathLabels = (ids: string[]): Record<string, string> => {
  const uniqueIds = useMemo(() => [...new Set(ids)].slice(0, MAX_IDS), [ids]);

  const { data } = useSearchCategoriesQuery({
    variables: { first: MAX_IDS, filter: { ids: uniqueIds } },
    skip: uniqueIds.length === 0,
  });

  return useMemo(
    () =>
      Object.fromEntries(
        (mapEdgesToItems(data?.search) ?? []).map(category => [
          category.id,
          getCategoryPathLabel(category),
        ]),
      ),
    [data],
  );
};

interface SavedAttribute {
  attribute: { entityType?: AttributeEntityTypeEnum | null };
  values: Array<{ reference?: string | null }>;
}

/**
 * Craftware (Örninn FEAT-263): full-path labels for the categories saved on an entity's category
 * reference attributes (product, variant, model). Their values only carry the bare name, so the
 * chips would read "Shirts" again after a reload without this.
 */
export const useSavedCategoryReferenceLabels = (
  attributes: SavedAttribute[] | null | undefined,
): Record<string, string> => {
  const key = (attributes ?? [])
    .filter(({ attribute }) => attribute.entityType === AttributeEntityTypeEnum.CATEGORY)
    .flatMap(({ values }) => values.map(({ reference }) => reference))
    .filter((id): id is string => !!id)
    .join(",");
  const ids = useMemo(() => (key ? key.split(",") : []), [key]);

  return useCategoryPathLabels(ids);
};
