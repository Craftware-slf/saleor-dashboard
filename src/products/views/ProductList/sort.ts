// @ts-strict-ignore
import { type ProductOrder, ProductOrderField } from "@dashboard/graphql";
import { type ProductListUrlQueryParams, ProductListUrlSortField } from "@dashboard/products/urls";
import { getOrderDirection } from "@dashboard/utils/sort";

import { isAttributeSortField, type SortAttributeIds } from "./sortAttributes";

export const DEFAULT_SORT_KEY = ProductListUrlSortField.name;

export function canBeSorted(
  sort: ProductListUrlSortField,
  isChannelSelected: boolean,
  sortAttributeIds: SortAttributeIds = {},
): boolean {
  switch (sort) {
    case ProductListUrlSortField.name:
    case ProductListUrlSortField.productType:
    case ProductListUrlSortField.date:
    case ProductListUrlSortField.created:
    case ProductListUrlSortField.attribute:
    case ProductListUrlSortField.rank:
      return true;
    case ProductListUrlSortField.price:
    case ProductListUrlSortField.availability:
      return isChannelSelected;
    // Only sortable where the backing attribute exists on this instance (FEAT-210).
    case ProductListUrlSortField.sku:
    case ProductListUrlSortField.category:
      return !!sortAttributeIds[sort];
    default:
      return false;
  }
}

function getSortQueryField(sort: ProductListUrlSortField): ProductOrderField {
  switch (sort) {
    case ProductListUrlSortField.name:
      return ProductOrderField.NAME;
    case ProductListUrlSortField.price:
      return ProductOrderField.PRICE;
    case ProductListUrlSortField.productType:
      return ProductOrderField.TYPE;
    case ProductListUrlSortField.availability:
      return ProductOrderField.PUBLISHED;
    case ProductListUrlSortField.rank:
      return ProductOrderField.RANK;
    case ProductListUrlSortField.date:
      return ProductOrderField.DATE;
    case ProductListUrlSortField.created:
      return ProductOrderField.CREATED_AT;
    default:
      return undefined;
  }
}

/**
 * The sort the list actually applies. A `sort=sku` / `sort=category` URL on an instance without
 * the backing attribute (or a shared link opened before it existed) degrades to the default sort
 * instead of erroring or silently returning an unsorted list.
 */
export function getEffectiveSortField(
  sort: ProductListUrlSortField,
  sortAttributeIds: SortAttributeIds = {},
): ProductListUrlSortField {
  if (isAttributeSortField(sort) && !sortAttributeIds[sort]) {
    return DEFAULT_SORT_KEY;
  }

  return sort;
}

export function getSortQueryVariables(
  params: ProductListUrlQueryParams,
  isChannelSelected: boolean,
  sortAttributeIds: SortAttributeIds = {},
): ProductOrder {
  const sort = getEffectiveSortField(params.sort, sortAttributeIds);

  if (!canBeSorted(sort, isChannelSelected, sortAttributeIds)) {
    return;
  }

  const direction = getOrderDirection(params.asc);

  if (isAttributeSortField(sort)) {
    return {
      attributeId: sortAttributeIds[sort],
      direction,
    };
  }

  if (sort === ProductListUrlSortField.attribute) {
    return {
      attributeId: params.attributeId,
      direction,
    };
  }

  const field = getSortQueryField(sort);

  return {
    direction,
    field,
  };
}
