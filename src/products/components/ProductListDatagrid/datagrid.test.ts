import { getDescriptionValue, getSkuValue, getStockValue } from "./datagrid";

describe("getStockValue", () => {
  it("should return 0 when the product has no variants", () => {
    expect(getStockValue([])).toBe(0);
  });

  it("should return 0 when a variant carries no stock rows", () => {
    expect(getStockValue([{ stocks: [] }, { stocks: null }])).toBe(0);
  });

  it("should subtract allocated units from quantity", () => {
    expect(getStockValue([{ stocks: [{ quantity: 10, quantityAllocated: 3 }] }])).toBe(7);
  });

  it("should sum across every variant of a product", () => {
    expect(
      getStockValue([
        { stocks: [{ quantity: 5, quantityAllocated: 0 }] },
        { stocks: [{ quantity: 4, quantityAllocated: 1 }] },
        { stocks: [{ quantity: 1, quantityAllocated: 1 }] },
      ]),
    ).toBe(8); // (5-0) + (4-1) + (1-1)
  });

  it("should sum across multiple warehouses on one variant", () => {
    // With a channel selected Saleor returns only that channel's warehouses, but a channel
    // can legitimately be served by more than one.
    expect(
      getStockValue([
        {
          stocks: [
            { quantity: 6, quantityAllocated: 2 },
            { quantity: 3, quantityAllocated: 0 },
          ],
        },
      ]),
    ).toBe(7);
  });

  it("should report oversold stock as negative rather than clamping to 0", () => {
    // Allocations can exceed quantity; hiding that would make a problem product look fine.
    expect(getStockValue([{ stocks: [{ quantity: 1, quantityAllocated: 4 }] }])).toBe(-3);
  });

  describe("restricted to channel-serving warehouses (the channel-less total)", () => {
    const brand = { id: "wh-golf" };
    const retired = { id: "wh-orninn-lager" };
    const serving: ReadonlySet<string> = new Set(["wh-golf"]);

    it("should ignore rows in a warehouse that serves no channel", () => {
      // The exact shape of the local stack: real stock in the brand warehouse, stale rows
      // left behind in the retired one. Counting both is what inflated the total.
      expect(
        getStockValue(
          [
            {
              stocks: [
                { quantity: 4, quantityAllocated: 0, warehouse: brand },
                { quantity: 99, quantityAllocated: 0, warehouse: retired },
              ],
            },
          ],
          serving,
        ),
      ).toBe(4);
    });

    it("should return 0 when every row sits in a non-serving warehouse", () => {
      expect(
        getStockValue(
          [{ stocks: [{ quantity: 99, quantityAllocated: 0, warehouse: retired }] }],
          serving,
        ),
      ).toBe(0);
    });

    it("should drop rows with no warehouse at all rather than counting them", () => {
      expect(
        getStockValue(
          [
            {
              stocks: [
                { quantity: 7, quantityAllocated: 0, warehouse: brand },
                { quantity: 5, quantityAllocated: 0, warehouse: null },
              ],
            },
          ],
          serving,
        ),
      ).toBe(7);
    });

    it("should count every row when no set is passed, which is the channel-selected path", () => {
      // Saleor has already scoped the rows there, so filtering again would be wrong.
      expect(
        getStockValue([
          {
            stocks: [
              { quantity: 4, quantityAllocated: 0, warehouse: brand },
              { quantity: 99, quantityAllocated: 0, warehouse: retired },
            ],
          },
        ]),
      ).toBe(103);
    });
  });
});

describe("getDescriptionValue", () => {
  it("should return description value", () => {
    expect(
      getDescriptionValue(
        '{"time": 1634014163888, "blocks": [{"data": {"text": "description"}, "type": "paragraph"}], "version": "2.20.0"}',
      ),
    ).toBe("description");
  });

  it("should return empty string when no description data", () => {
    expect(getDescriptionValue('{"blocks": [{"data": {}, "type": "paragraph"}]}')).toBe("");
  });

  it("should replace all &nbsp; with empty string", () => {
    expect(
      getDescriptionValue(
        '{"time": 1637142885936, "blocks": [{"data": {"text": "&nbsp;&nbsp;&nbsp;&nbsp;description&nbsp;&nbsp;"}, "type": "paragraph"}], "version": "2.20.0"}',
      ),
    ).toBe("description");
  });

  it("should replace all html tags with empty string", () => {
    expect(
      getDescriptionValue(
        '{"time": 1637142885936, "blocks": [{"data": {"text": "<b><a href=http://fooflw.pl>Link</a><i> description</i></b>"}, "type": "paragraph"}], "version": "2.20.0"}',
      ),
    ).toBe("Link description");
  });

  it("should omit blocks with empty text", () => {
    expect(
      getDescriptionValue(
        '{"time": 1634014163888, "blocks": [{"data": {"text": ""}, "type": "heading"},{"data": {"text": ""}, "type": "paragraph"},{"data": {"text": "description"}, "type": "paragraph"}], "version": "2.20.0"}',
      ),
    ).toBe("description");
  });

  it("should cut description when too long", () => {
    expect(
      getDescriptionValue(
        '{"time": 1634014163888, "blocks": [{"data": {"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tempus, nisi sed dapibus eleifend, nisl tellus tempor mi, tristique pretium."}, "type": "heading"},{"data": {"text": ""}, "type": "paragraph"},{"data": {"text": "description"}, "type": "paragraph"}], "version": "2.20.0"}',
      ),
    ).toBe(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tempus, nisi sed dapibus eleifend, nisl ...",
    );
  });
});

describe("getSkuValue", () => {
  it("should show a dash when the product has no variant SKUs", () => {
    expect(getSkuValue([])).toBe("-");
  });

  it("should show the SKU for a single-variant product", () => {
    expect(getSkuValue(["0100645087"])).toBe("0100645087");
  });

  it("should show the shared base SKU and a count for a multi-variant product", () => {
    expect(getSkuValue(["0100619559/48/8", "0100619559/51/8", "0100619559/54/8"])).toBe(
      "0100619559 (+3)",
    );
  });

  it("should fall back to the first SKU when variants share no common prefix", () => {
    expect(getSkuValue(["ABC-1", "XYZ-2"])).toBe("ABC-1 (+2)");
  });
});
