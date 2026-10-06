import {
  getPaymentMethod,
  isKnownPaymentMethod,
  PAYMENT_METHOD_METADATA_KEY,
} from "./paymentMethod";

const item = (key: string, value: string) => ({
  __typename: "MetadataItem" as const,
  key,
  value,
});

describe("getPaymentMethod", () => {
  it("reads the value the storefront stamps", () => {
    expect(getPaymentMethod([item("kennitala", "x"), item("payment_method", "krafa")])).toBe(
      "krafa",
    );
    expect(PAYMENT_METHOD_METADATA_KEY).toBe("payment_method");
  });

  it.each([
    ["no metadata", undefined],
    ["null metadata", null],
    ["empty metadata", []],
    ["other keys only", [item("kennitala", "0101902079")]],
    ["a blank value", [item("payment_method", "  ")]],
  ])("returns null for %s", (_label, metadata) => {
    expect(getPaymentMethod(metadata)).toBeNull();
  });

  it("normalises case and whitespace", () => {
    expect(getPaymentMethod([item("payment_method", " Teya ")])).toBe("teya");
  });

  it("passes an unrecognised method through rather than dropping it", () => {
    expect(getPaymentMethod([item("payment_method", "pei")])).toBe("pei");
  });
});

describe("isKnownPaymentMethod", () => {
  it("knows the three methods the stores take today", () => {
    expect(["krafa", "teya", "netgiro"].every(isKnownPaymentMethod)).toBe(true);
    expect(isKnownPaymentMethod("pei")).toBe(false);
  });
});
