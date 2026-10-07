import { defineMessages } from "react-intl";

export const messages = defineMessages({
  paymentMethod: {
    id: "o9JvJ4",
    defaultMessage: "Payment method",
    description: "label for how the order was paid, shown above the items to fulfill",
  },
  paymentMethodKrafa: {
    id: "vLvAX3",
    defaultMessage: "Krafa (on account)",
    description: "payment method: Örninn B2B on-account order",
  },
  paymentMethodTeya: {
    id: "k9yaUR",
    defaultMessage: "Card (Teya)",
    description: "payment method: card payment through Teya",
  },
  paymentMethodNetgiro: {
    id: "BgxsuW",
    defaultMessage: "Netgíró",
    description: "payment method: Netgíró",
  },
  paymentMethodNone: {
    id: "/dHYgX",
    defaultMessage: "Not recorded",
    description: "payment method: order carries no payment method",
  },
  headerOrderNumberAddFulfillment: {
    id: "CJpx4E",
    defaultMessage: "Order no. {orderNumber} - Add Fulfillment",
    description: "page header",
  },
  submitFulfillment: {
    id: "BLX9dz",
    defaultMessage: "Fulfill",
    description: "fulfill order, button",
  },
  submitPrepareFulfillment: {
    id: "Uh9R9m",
    defaultMessage: "Prepare fulfillment",
    description: "prepare order fulfillment, button",
  },
  itemsReadyToShip: {
    id: "N5UuEK",
    defaultMessage: "Items ready to ship",
    description: "header",
  },
  productName: {
    id: "vW3tb6",
    defaultMessage: "Product name",
    description: "name",
  },
  trackingNumberInputLabel: {
    id: "R4IIw1",
    defaultMessage: "Tracking number",
    description: "tracking number of the shipment",
  },
  trackingNumberInputHelperText: {
    id: "Q7eRF7",
    defaultMessage: "Optionally provide a tracking number for this fulfillment",
    description: "tracking number input helper text",
  },
  sku: {
    id: "fw+VAN",
    defaultMessage: "SKU",
    description: "product's sku",
  },
  quantityToFulfill: {
    id: "Kg0Fiu",
    defaultMessage: "Quantity to fulfill",
    description: "quantity of fulfilled products",
  },
  quantity: {
    defaultMessage: "Quantity",
    id: "0mhR+F",
    description: "Header row quantity label",
  },
  stock: {
    defaultMessage: "Stock",
    id: "tZnV8L",
    description: "Header row stock label",
  },
  noStock: {
    id: "z9wQ/U",
    defaultMessage: "No Stock",
    description: "no variant stock in warehouse",
  },
  sentFulfillmentDetails: {
    id: "8Cve4h",
    defaultMessage: "Send fulfillment email to customer",
    description: "checkbox label",
  },
  shipmentInformation: {
    defaultMessage: "Shipment information",
    id: "lF+VJQ",
    description: "Shipment information card header",
  },
  warehouse: {
    defaultMessage: "Warehouse",
    id: "J0lNnk",
    description: "column label",
  },
});
