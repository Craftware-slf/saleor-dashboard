import { useProductListSortAttributesQuery } from "@dashboard/graphql";
import { ProductListUrlSortField } from "@dashboard/products/urls";
import { useMemo } from "react";

/**
 * Örninn FEAT-210. Saleor 3.23 has no SKU or category product sort, so the orninn sync worker
 * keeps two hidden PLAIN_TEXT product attributes up to date and the list sorts by those through
 * Saleor's `sortBy: { attributeId, direction }`:
 *
 * - `sort_sku` — the product's lowest variant SKU
 * - `sort_category` — the product's category name
 *
 * Saleor sorts attribute values as strings; products without a value go last ascending and
 * first descending.
 */
export const PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS = {
  [ProductListUrlSortField.sku]: "sort_sku",
  [ProductListUrlSortField.category]: "sort_category",
} as const;

export type AttributeSortField = keyof typeof PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS;

/** Attribute ids resolved on this instance; a field is absent when its attribute doesn't exist. */
export type SortAttributeIds = Partial<Record<AttributeSortField, string>>;

export function isAttributeSortField(
  sort: ProductListUrlSortField | undefined,
): sort is AttributeSortField {
  return sort === ProductListUrlSortField.sku || sort === ProductListUrlSortField.category;
}

/** Maps the lookup query's nodes onto sort fields, ignoring any slug that isn't ours. */
export function mapSortAttributeIds(
  nodes: ReadonlyArray<{ id: string; slug: string | null }>,
): SortAttributeIds {
  const ids: SortAttributeIds = {};

  for (const [field, slug] of Object.entries(PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS)) {
    const node = nodes.find(candidate => candidate.slug === slug);

    if (node) {
      ids[field as AttributeSortField] = node.id;
    }
  }

  return ids;
}

interface ProductListSortAttributes {
  ids: SortAttributeIds;
  /** True until the lookup has settled, so a `sort=sku` URL isn't queried unsorted first. */
  loading: boolean;
}

/**
 * Resolves the SKU/Category sort attributes by slug. Cached for the session: the ids never
 * change once the attributes exist. A failed lookup resolves to no ids, which makes both
 * columns unsortable rather than sending a broken sort.
 */
export const useProductListSortAttributes = (): ProductListSortAttributes => {
  const { data, loading } = useProductListSortAttributesQuery({
    variables: { slugs: Object.values(PRODUCT_LIST_SORT_ATTRIBUTE_SLUGS) },
    fetchPolicy: "cache-first",
  });

  const ids = useMemo(
    () => mapSortAttributeIds((data?.attributes?.edges ?? []).map(edge => edge.node)),
    [data],
  );

  return { ids, loading };
};
