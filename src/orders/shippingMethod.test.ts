import { getOrderShippingMethod } from "./shippingMethod";

const item = (key: string, value: string) => ({
  __typename: "MetadataItem" as const,
  key,
  value,
});

const shippingMethod = (name: string) => ({
  __typename: "ShippingMethod" as const,
  name,
});

describe("getOrderShippingMethod", () => {
  it("shows the pickup warehouse for click & collect", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: null,
        metadata: [],
        deliveryMethod: {
          __typename: "Warehouse",
          name: "Örninn Faxafen",
        },
      }),
    ).toEqual({ kind: "pickup", warehouseName: "Örninn Faxafen" });
  });

  it("prefers the name snapshotted on the order over the live method's", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: "Pósturinn – Heimsending",
        metadata: [],
        deliveryMethod: shippingMethod("Renamed later"),
      }),
    ).toEqual({ kind: "shipping", name: "Pósturinn – Heimsending", pickupPoint: null });
  });

  it("falls back to the live method's name when the order has none", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: "  ",
        metadata: [],
        deliveryMethod: shippingMethod("Pósturinn"),
      }),
    ).toEqual({ kind: "shipping", name: "Pósturinn", pickupPoint: null });
  });

  it("adds the Dropp pickup point the storefront stamps", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: "Dropp.is – Höfuðborgarsvæðið",
        metadata: [
          item("dropp_pickup_point_name", "Dropp Kringlan"),
          item("dropp_pickup_point_address", "Kringlan 1, 103 Reykjavík"),
        ],
        deliveryMethod: shippingMethod("Dropp.is – Höfuðborgarsvæðið"),
      }),
    ).toEqual({
      kind: "shipping",
      name: "Dropp.is – Höfuðborgarsvæðið",
      pickupPoint: "Dropp Kringlan, Kringlan 1, 103 Reykjavík",
    });
  });

  it("shows a pickup point name stamped without an address", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: "Dropp.is",
        metadata: [item("dropp_pickup_point_name", "Dropp Kringlan")],
        deliveryMethod: null,
      }),
    ).toEqual({ kind: "shipping", name: "Dropp.is", pickupPoint: "Dropp Kringlan" });
  });

  it("returns null when the order has no delivery method", () => {
    expect(
      getOrderShippingMethod({ shippingMethodName: null, metadata: [], deliveryMethod: null }),
    ).toBeNull();
    expect(getOrderShippingMethod(null)).toBeNull();
  });
});
