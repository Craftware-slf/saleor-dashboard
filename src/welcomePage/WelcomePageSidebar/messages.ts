import { defineMessages } from "react-intl";

export const welcomePageMessages = defineMessages({
  salesCardTitle: {
    defaultMessage: "Sales",
    id: "c8nvms",
  },
  outOfStockCardTitle: {
    defaultMessage: "Out of stock",
    id: "WHgdsk",
  },
  thisMonthCardTitle: {
    defaultMessage: "This month",
    id: "HlRbR9",
    description: "home sidebar, title of the month-to-date sales card",
  },
  thisMonthSales: {
    defaultMessage: "Sales",
    id: "DJcksY",
    description: "home sidebar, month-to-date sales row",
  },
  thisMonthOrders: {
    defaultMessage: "Orders",
    id: "DqzLQv",
    description: "home sidebar, month-to-date order count row",
  },
  thisMonthAverageOrderValue: {
    defaultMessage: "Average order value",
    id: "Ea5zpf",
    description: "home sidebar, month-to-date average order value row",
  },
  comparedWithLastMonth: {
    defaultMessage: "% change vs. the same days last month",
    id: "a5AhAe",
    description: "home sidebar, caption under the month-to-date card explaining the percentages",
  },
  awaitingShipmentCardTitle: {
    defaultMessage: "Awaiting shipment",
    id: "Y0Jsjr",
    description: "home sidebar, count of unfulfilled and partially fulfilled orders",
  },
  awaitingShipmentSubtitle: {
    defaultMessage: "Unfulfilled orders",
    id: "vzThU2",
    description: "home sidebar, subtitle of the awaiting shipment card",
  },
  topProductsTitle: {
    defaultMessage: "Top products this month",
    id: "EqTwcs",
    description: "home sidebar, header of the best sellers list",
  },
  topProductsUnits: {
    defaultMessage: "{quantity} sold",
    id: "aqxrSG",
    description: "home sidebar, units sold of one product this month",
  },
  topProductsEmpty: {
    defaultMessage: "No sales yet this month",
    id: "IW84jX",
    description: "home sidebar, best sellers list is empty",
  },
  topProductsTruncated: {
    defaultMessage: "Based on the first {count} orders",
    id: "YIOYfX",
    description: "home sidebar, best sellers were computed from a partial order list",
  },
});
