import { type MetadataItemFragment } from "@dashboard/graphql";

/**
 * The Dropp pickup point the shopper chose. The Örninn storefronts stamp it onto the
 * checkout as PUBLIC metadata, and Saleor copies it onto the order — see
 * `ORDER_META.droppPickupPointName` / `droppPickupPointAddress` in packages/carriers of
 * the orninn monorepo.
 */
export const DROPP_PICKUP_POINT_NAME_KEY = "dropp_pickup_point_name";
export const DROPP_PICKUP_POINT_ADDRESS_KEY = "dropp_pickup_point_address";

/** The order fields this reads — selected by the order list query. */
export interface OrderShippingFields {
  shippingMethodName?: string | null;
  deliveryMethod?:
    | { __typename: "ShippingMethod"; name?: string }
    | { __typename: "Warehouse"; name: string }
    | null;
  metadata?: MetadataItemFragment[] | null;
}

export type OrderShippingMethod =
  /** Click & collect: the shopper picks the order up from this warehouse. */
  | { kind: "pickup"; warehouseName: string }
  /** Shipped by a carrier; `pickupPoint` is set when the shopper chose a Dropp point. */
  | { kind: "shipping"; name: string; pickupPoint: string | null };

const readMetadata = (
  metadata: MetadataItemFragment[] | undefined | null,
  key: string,
): string | null => {
  const value = metadata?.find(item => item.key === key)?.value?.trim();

  return value ? value : null;
};

const getDroppPickupPoint = (
  metadata: MetadataItemFragment[] | undefined | null,
): string | null => {
  const name = readMetadata(metadata, DROPP_PICKUP_POINT_NAME_KEY);
  const address = readMetadata(metadata, DROPP_PICKUP_POINT_ADDRESS_KEY);

  if (name && address) {
    return `${name}, ${address}`;
  }

  return name ?? address;
};

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

  return { kind: "shipping", name, pickupPoint: getDroppPickupPoint(order.metadata) };
};
