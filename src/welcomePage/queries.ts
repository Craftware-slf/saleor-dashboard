import { gql } from "@apollo/client";

export const welcomePageActivities = gql`
  query WelcomePageActivities($hasPermissionToManageOrders: Boolean!) {
    activities: homepageEvents(last: 10) @include(if: $hasPermissionToManageOrders) {
      edges {
        node {
          ...Activities
        }
      }
    }
  }
`;

export const welcomePageAnalytics = gql`
  query WelcomePageAnalytics($channel: String!, $hasPermissionToManageOrders: Boolean!) {
    salesToday: ordersTotal(period: TODAY, channel: $channel)
      @include(if: $hasPermissionToManageOrders) {
      gross {
        amount
        currency
      }
    }
  }
`;

export const welcomePageNotifications = gql`
  query welcomePageNotifications($channel: String!) {
    productsOutOfStock: products(filter: { stockAvailability: OUT_OF_STOCK }, channel: $channel) {
      totalCount
    }
  }
`;

export const welcomePageMonthAnalytics = gql`
  query WelcomePageMonthAnalytics(
    $channel: String!
    $channelId: ID!
    $monthStart: DateTime!
    $countedStatuses: [OrderStatus!]!
    $awaitingShipmentStatuses: [OrderStatus!]!
  ) {
    salesThisMonth: ordersTotal(period: THIS_MONTH, channel: $channel) {
      gross {
        amount
        currency
      }
    }
    ordersThisMonth: orders(
      first: 1
      where: {
        channelId: { eq: $channelId }
        createdAt: { gte: $monthStart }
        status: { oneOf: $countedStatuses }
      }
    ) {
      totalCount
    }
    awaitingShipment: orders(
      first: 1
      where: { channelId: { eq: $channelId }, status: { oneOf: $awaitingShipmentStatuses } }
    ) {
      totalCount
    }
  }
`;

export const welcomePageOrdersInPeriod = gql`
  query WelcomePageOrdersInPeriod(
    $channelId: ID!
    $from: DateTime!
    $to: DateTime
    $countedStatuses: [OrderStatus!]!
    $after: String
    $withLines: Boolean!
  ) {
    orders(
      first: 100
      after: $after
      where: {
        channelId: { eq: $channelId }
        createdAt: { gte: $from, lte: $to }
        status: { oneOf: $countedStatuses }
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          total {
            gross {
              amount
              currency
            }
          }
          lines @include(if: $withLines) {
            id
            quantity
            productName
            productSku
            variant {
              id
              product {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;
