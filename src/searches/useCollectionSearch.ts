// @ts-strict-ignore
import { gql } from "@apollo/client";
import {
  SearchCollectionsDocument,
  type SearchCollectionsQuery,
  type SearchCollectionsQueryVariables,
  SearchCollectionsWithTotalProductsDocument,
  type SearchCollectionsWithTotalProductsQuery,
  type SearchCollectionsWithTotalProductsQueryVariables,
  SearchRuleConditionCollectionsDocument,
  type SearchRuleConditionCollectionsQuery,
  type SearchRuleConditionCollectionsQueryVariables,
} from "@dashboard/graphql";
import makeTopLevelSearch from "@dashboard/hooks/makeTopLevelSearch";

export const searchCollections = gql`
  query SearchCollections(
    $after: String
    $first: Int!
    $channel: String
    $filter: CollectionFilterInput
  ) {
    search: collections(after: $after, first: $first, filter: $filter, channel: $channel) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        ...PageInfo
      }
    }
  }
`;

export const searchCollectionWithTotalProducts = gql`
  query SearchCollectionsWithTotalProducts(
    $after: String
    $first: Int!
    $filter: CollectionFilterInput
    $channel: String
  ) {
    search: collections(after: $after, first: $first, filter: $filter, channel: $channel) {
      edges {
        node {
          ...CollectionWithTotalProducts
        }
      }
      pageInfo {
        ...PageInfo
      }
    }
  }
`;

/**
 * Collection search used by discount rule conditions (Collections and Brands).
 * `brandPageId` exposes the `brand_page_id` metadata key that marks a brand
 * collection (see `src/discounts/brandCollections.ts`), so brand collections can
 * be told apart from regular ones on the client.
 */
export const searchRuleConditionCollections = gql`
  query SearchRuleConditionCollections(
    $after: String
    $first: Int!
    $channel: String
    $filter: CollectionFilterInput
  ) {
    search: collections(after: $after, first: $first, filter: $filter, channel: $channel) {
      edges {
        node {
          id
          name
          slug
          brandPageId: metafield(key: "brand_page_id")
        }
      }
      pageInfo {
        ...PageInfo
      }
    }
  }
`;

export const useRuleConditionCollectionSearch = makeTopLevelSearch<
  SearchRuleConditionCollectionsQuery,
  SearchRuleConditionCollectionsQueryVariables
>(SearchRuleConditionCollectionsDocument, {
  mapSearchToVariables: (searchQuery, variables) => ({
    ...variables,
    filter: { ...variables.filter, search: searchQuery },
  }),
});

export const useCollectionWithTotalProductsSearch = makeTopLevelSearch<
  SearchCollectionsWithTotalProductsQuery,
  SearchCollectionsWithTotalProductsQueryVariables
>(SearchCollectionsWithTotalProductsDocument, {
  mapSearchToVariables: (searchQuery, variables) => ({
    ...variables,
    filter: { ...variables.filter, search: searchQuery },
  }),
});

export default makeTopLevelSearch<SearchCollectionsQuery, SearchCollectionsQueryVariables>(
  SearchCollectionsDocument,
  {
    mapSearchToVariables: (searchQuery, variables) => ({
      ...variables,
      filter: { ...variables.filter, search: searchQuery },
    }),
  },
);
