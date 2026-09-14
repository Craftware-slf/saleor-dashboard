import { formatKennitala, getKennitala, KENNITALA_METADATA_KEY } from "./kennitala";

const item = (key: string, value: string) => ({
  __typename: "MetadataItem" as const,
  key,
  value,
});

describe("getKennitala", () => {
  it("reads the value stored under the kennitala key", () => {
    expect(
      getKennitala([item("external_app_shipping_id", "abc"), item("kennitala", "0101902079")]),
    ).toBe("0101902079");
  });

  it("uses the same key the storefront writes", () => {
    expect(KENNITALA_METADATA_KEY).toBe("kennitala");
  });

  // Orders placed before the field was captured (prod #2-#8) carry no private
  // metadata at all. That is a real state, not a failure.
  it.each([
    ["no metadata at all", undefined],
    ["null metadata", null],
    ["empty metadata", []],
    ["other keys only", [item("external_app_shipping_id", "abc")]],
  ])("returns null for %s", (_label, metadata) => {
    expect(getKennitala(metadata)).toBeNull();
  });

  it("treats a blank value as absent rather than rendering an empty field", () => {
    expect(getKennitala([item("kennitala", "   ")])).toBeNull();
  });

  it("trims incidental whitespace", () => {
    expect(getKennitala([item("kennitala", " 0101902079 ")])).toBe("0101902079");
  });
});

describe("formatKennitala", () => {
  it("renders 10 digits as DDMMYY-NNNN", () => {
    expect(formatKennitala("0101902079")).toBe("010190-2079");
  });

  // The storefront normalises before writing, so anything else means the data is not
  // what we think it is — show it as stored rather than slicing it into a shape that
  // looks authoritative and is not.
  it.each([
    ["already hyphenated", "010190-2079"],
    ["too short", "123"],
    ["too long", "01019020791"],
    ["non-numeric", "not-a-kennitala"],
    ["empty", ""],
  ])("passes through an unexpected value verbatim (%s)", (_label, value) => {
    expect(formatKennitala(value)).toBe(value);
  });
});
