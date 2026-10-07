/** The order fields this reads — selected by the order list query. */
export interface OrderShippingFields {
  shippingMethodName?: string | null;
  deliveryMethod?:
    | { __typename: "ShippingMethod"; name?: string }
    | { __typename: "Warehouse"; name: string }
    | null;
}

export type OrderShippingMethod =
  /** Click & collect: the shopper picks the order up from this warehouse. */
  | { kind: "pickup"; warehouseName: string }
  /**
   * Any other method, by name only — Örninn's are "Pósturinn", "Dropp.is" and
   * "Sótt í verslun". The Dropp pickup point is deliberately not shown here.
   */
  | { kind: "shipping"; name: string };

/**
 * How the order ships, or null when it carries no delivery method (e.g. nothing in it
 * needs shipping). `shippingMethodName` is preferred over the live method's name because
 * Saleor snapshots it onto the order, so it survives the method being renamed or deleted.
 */
export const getOrderShippingMethod = (
  order: OrderShippingFields | null | undefined,
): OrderShippingMethod | null => {
  if (!order) {
    return null;
  }

  const { deliveryMethod } = order;

  if (deliveryMethod?.__typename === "Warehouse") {
    return { kind: "pickup", warehouseName: deliveryMethod.name };
  }

  const name =
    order.shippingMethodName?.trim() ||
    (deliveryMethod?.__typename === "ShippingMethod" ? deliveryMethod.name?.trim() : null);

  if (!name) {
    return null;
  }

  return { kind: "shipping", name };
};
