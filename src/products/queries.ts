import { gql } from "@apollo/client";

export const productListQuery = gql`
  query ProductList(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: ProductFilterInput
    $search: String
    $where: ProductWhereInput
    $channel: String
    $sort: ProductOrder
    $hasChannel: Boolean!
    $includeCategories: Boolean!
    $includeCollections: Boolean!
  ) {
    products(
      before: $before
      after: $after
      first: $first
      last: $last
      filter: $filter
      search: $search
      where: $where
      sortBy: $sort
      channel: $channel
    ) {
      edges {
        node {
          ...ProductWithChannelListings
          updatedAt
          created
          description
          variants {
            sku
            # Deliberately NOT quantityAvailable: that field is channel-resolved, so on the
            # default (channel-less) list it throws "More than one channel exists" for any
            # cross-listed product. Warehouse stock rows carry no such requirement.
            stocks {
              id
              quantity
              quantityAllocated
              warehouse {
                id
                slug
              }
            }
          }
          attributes {
            ...ProductListAttribute
          }
        }
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;
/**
 * SKU-fragment fallback for the product list search box (FEAT-188).
 *
 * `products(search:)` is Postgres full-text: `prefix_search()` builds a tsquery
 * with `:*` per lexeme, so it matches a query word only as the PREFIX of an
 * indexed word. Every Örninn SKU opens with the same "0100…" run of digits, so
 * the fragment staff actually type — the distinctive tail — finds nothing.
 *
 * `productVariants(filter: { search: ... })` is a different mechanism entirely:
 * `Q(name__ilike=v) | Q(sku__ilike=v)`, a raw `ILIKE '%v%'` straight at the
 * variant's sku column. Measured against Saleor 3.23: "06287" returns 0 products
 * through `products(search:)` and exactly 1 through this. It cannot use an index,
 * but it is a 10 ms sequential scan over 32,300 variants.
 *
 * Careful: the TOP-LEVEL `productVariants(search:)` argument is NOT this — it
 * routes back through `prefix_search()` on the product's search vector. Only the
 * `filter: { search: }` form does the ILIKE.
 */
export const productIdsBySkuQuery = gql`
  query ProductIdsBySku($query: String!, $channel: String, $first: Int!) {
    productVariants(first: $first, filter: { search: $query }, channel: $channel) {
      edges {
        node {
          product {
            id
          }
        }
      }
    }
  }
`;
export const productCountQuery = gql`
  query ProductCount($filter: ProductFilterInput, $channel: String) {
    products(filter: $filter, channel: $channel) {
      totalCount
    }
  }
`;

export const productDetailsQuery = gql`
  query ProductDetails(
    $id: ID!
    $channel: String
    $firstValues: Int
    $afterValues: String
    $lastValues: Int
    $beforeValues: String
    $searchValues: String
  ) {
    product(id: $id, channel: $channel) {
      ...Product
      category {
        ...CategoryWithAncestors
      }
    }
  }
`;

export const productTypeQuery = gql`
  query ProductType(
    $id: ID!
    $firstValues: Int
    $afterValues: String
    $lastValues: Int
    $beforeValues: String
    $searchValues: String
  ) {
    productType(id: $id) {
      id
      name
      hasVariants
      productAttributes {
        ...AttributeDetails
      }
      taxClass {
        id
        name
      }
    }
  }
`;
export const productVariantQuery = gql`
  query ProductVariantDetails(
    $id: ID!
    $firstValues: Int
    $afterValues: String
    $lastValues: Int
    $beforeValues: String
  ) {
    productVariant(id: $id) {
      ...ProductVariant
    }
  }
`;

export const productVariantCreateQuery = gql`
  query ProductVariantCreateData(
    $id: ID!
    $firstValues: Int
    $afterValues: String
    $lastValues: Int
    $beforeValues: String
  ) {
    product(id: $id) {
      id
      media {
        id
        sortOrder
        url
      }
      channelListings {
        isPublished
        publishedAt
        channel {
          id
          name
          currencyCode
        }
      }
      name
      productType {
        id
        name
        hasVariants
        selectionVariantAttributes: variantAttributes(variantSelection: VARIANT_SELECTION) {
          ...VariantAttribute
        }
        nonSelectionVariantAttributes: variantAttributes(variantSelection: NOT_VARIANT_SELECTION) {
          ...VariantAttribute
        }
      }
      thumbnail {
        url
      }
      defaultVariant {
        id
      }
      variants {
        id
        name
        sku
        media {
          id
          url
          type
        }
      }
    }
  }
`;

export const productMediaQuery = gql`
  query ProductMediaById($productId: ID!, $mediaId: ID!) {
    product(id: $productId) {
      id
      name
      mainImage: mediaById(id: $mediaId) {
        id
        ...Metadata
        alt
        url
        type
        oembedData
      }
      media {
        id
        url(size: 48)
        alt
        type
        oembedData
      }
    }
  }
`;

export const gridAttributes = gql`
  query GridAttributes($ids: [ID!]!, $hasAttributes: Boolean!, $type: AttributeTypeEnum!) {
    availableAttributes: attributes(first: 10, filter: { type: $type }) {
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
    selectedAttributes: attributes(first: 25, filter: { ids: $ids }) @include(if: $hasAttributes) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

export const availableColumnAttribues = gql`
  query AvailableColumnAttributes(
    $search: String!
    $type: AttributeTypeEnum!
    $before: String
    $after: String
    $first: Int
    $last: Int
  ) {
    attributes(
      filter: { search: $search, type: $type }
      before: $before
      after: $after
      first: $first
      last: $last
    ) {
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

export const gridWarehouses = gql`
  query GridWarehouses($ids: [ID!]!, $hasWarehouses: Boolean!) {
    selectedWarehouses: warehouses(first: 100, filter: { ids: $ids }) @include(if: $hasWarehouses) {
      edges {
        node {
          ...Warehouse
        }
      }
    }
  }
`;

export const defaultGraphiQLQuery = `query ProductDetails($id: ID!) {
  product(id: $id) {
    id
    name
    slug
    description
  }
}`;

/**
 * Tiny per-page query for the active stock-availability mode flag.
 *
 * Used by surfaces that need to render mode-aware copy near stock UI
 * (e.g. `StockVisibilityHint` on the product/variant detail pages).
 *
 * Why this isn't on `useShop`/`ShopInfoQuery`: the global `ShopInfo` fragment
 * is widely consumed and we don't want to bloat it for a flag only a couple
 * of surfaces care about. Apollo dedupes identical queries, so concurrent
 * usages of this query collapse to a single request.
 */
export const stockVisibilityModeQuery = gql`
  query StockVisibilityMode {
    shop {
      id
      useLegacyShippingZoneStockAvailability
    }
  }
`;

/**
 * Query for product availability diagnostics.
 * Fetches channel and shipping zone data needed to determine
 * if a product can be purchased in each channel.
 *
 * Also reads `Shop.useLegacyShippingZoneStockAvailability` (Saleor 3.23+) so
 * the doctor can adapt severity/copy based on whether the shop uses legacy
 * shipping-zone-based stock filtering or the direct warehouse-channel link.
 * The field is scoped to this query (rather than the global ShopInfo) to
 * avoid loading it on every authenticated session.
 */
export const channelDiagnosticsQuery = gql`
  query ChannelDiagnostics {
    shop {
      id
      useLegacyShippingZoneStockAvailability
    }
    channels {
      id
      name
      slug
      currencyCode
      isActive
      warehouses {
        id
        name
      }
    }
    shippingZones(first: 100) {
      edges {
        node {
          id
          name
          channels {
            id
          }
          warehouses {
            id
            name
          }
          countries {
            code
            country
          }
        }
      }
    }
  }
`;

/**
 * Which warehouses actually serve a channel (FEAT-165).
 *
 * The Stock column sums warehouse stock rows. With a channel selected Saleor already scopes
 * `variant.stocks` to that channel's warehouses, so a plain sum is right. With NO channel it
 * returns every warehouse — including any that serves no channel at all, whose rows are stale
 * leftovers rather than sellable stock. On this installation `orninn_warehouse` (retired) and
 * `default-warehouse` are exactly that: measured on prod they are assigned to no channel, and
 * on the local stack `orninn_warehouse` still holds 381 stock rows that would inflate the total.
 *
 * So the channel-less total counts only warehouses reachable from some channel. That set is
 * derived here from `channels { warehouses }` rather than hardcoded, because warehouse slugs are
 * data — a new brand or a re-activated warehouse must not need a dashboard change.
 */
export const channelWarehousesQuery = gql`
  query ChannelWarehouses {
    channels {
      id
      warehouses {
        id
      }
    }
  }
`;
