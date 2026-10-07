import { getOrderShippingMethod } from "./shippingMethod";

const shippingMethod = (name: string) => ({
  __typename: "ShippingMethod" as const,
  name,
});

describe("getOrderShippingMethod", () => {
  it("shows the pickup warehouse for click & collect", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: null,
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
        deliveryMethod: shippingMethod("Renamed later"),
      }),
    ).toEqual({ kind: "shipping", name: "Pósturinn – Heimsending" });
  });

  it("falls back to the live method's name when the order has none", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: "  ",
        deliveryMethod: shippingMethod("Pósturinn"),
      }),
    ).toEqual({ kind: "shipping", name: "Pósturinn" });
  });

  it("shows a Dropp order by method name only, ignoring the stamped pickup point", () => {
    expect(
      getOrderShippingMethod({
        shippingMethodName: "Dropp.is",
        deliveryMethod: shippingMethod("Dropp.is"),
      }),
    ).toEqual({ kind: "shipping", name: "Dropp.is" });
  });

  it("returns null when the order has no delivery method", () => {
    expect(getOrderShippingMethod({ shippingMethodName: null, deliveryMethod: null })).toBeNull();
    expect(getOrderShippingMethod(null)).toBeNull();
  });
});
