import { isSkuShapedQuery } from "./useSkuFallbackSearch";

describe("isSkuShapedQuery", () => {
  it("accepts the SKU fragments staff actually type", () => {
    // Örninn base SKUs are 10 digits sharing a "0100…" prefix, so the useful
    // fragment is always the tail or a run from the middle.
    expect(isSkuShapedQuery("45087")).toBe(true);
    expect(isSkuShapedQuery("06287")).toBe(true);
    expect(isSkuShapedQuery("0100645087")).toBe(true);
  });

  it("accepts the BC variant shapes, separators and all", () => {
    expect(isSkuShapedQuery("0100627364/36")).toBe(true);
    expect(isSkuShapedQuery("0100652981-001")).toBe(true);
    expect(isSkuShapedQuery("JP84039")).toBe(true);
  });

  it("rejects ordinary product-name searches", () => {
    // These are what the primary full-text search is for. Routing them through
    // an ILIKE would match far too much and rank nothing.
    expect(isSkuShapedQuery("hjol")).toBe(false);
    expect(isSkuShapedQuery("slanga")).toBe(false);
    expect(isSkuShapedQuery("dekk 28")).toBe(false);
    expect(isSkuShapedQuery("1-Arm Holder")).toBe(false);
  });

  it("rejects fragments too short to be worth a lookup", () => {
    expect(isSkuShapedQuery("450")).toBe(false);
    expect(isSkuShapedQuery("12")).toBe(false);
    expect(isSkuShapedQuery("")).toBe(false);
    expect(isSkuShapedQuery(undefined)).toBe(false);
  });

  it("requires at least two digits, so letter-only codes do not qualify", () => {
    expect(isSkuShapedQuery("MULTI")).toBe(false);
    expect(isSkuShapedQuery("BLACK")).toBe(false);
    expect(isSkuShapedQuery("AB12")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(isSkuShapedQuery("  45087  ")).toBe(true);
    expect(isSkuShapedQuery("   ")).toBe(false);
  });
});
