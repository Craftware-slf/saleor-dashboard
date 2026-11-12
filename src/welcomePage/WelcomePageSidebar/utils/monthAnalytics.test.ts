import {
  getAverage,
  getMonthPeriods,
  getRelativeChange,
  getTopProducts,
  type OrderLineForRanking,
} from "./monthAnalytics";

describe("getMonthPeriods", () => {
  it("compares month-to-date with the same elapsed time last month", () => {
    // Arrange
    const now = new Date("2026-11-12T11:21:00.000Z");

    // Act
    const periods = getMonthPeriods(now);

    // Assert
    expect(periods.monthStart.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(periods.previousStart.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(periods.previousEnd.toISOString()).toBe("2026-10-12T11:21:00.000Z");
  });

  it("caps the comparison at the end of a shorter previous month", () => {
    // Arrange
    const now = new Date("2026-03-31T12:00:00.000Z");

    // Act
    const periods = getMonthPeriods(now);

    // Assert
    expect(periods.previousStart.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(periods.previousEnd.toISOString()).toBe("2026-02-28T23:59:59.999Z");
  });

  it("rolls back over a year boundary", () => {
    // Arrange
    const now = new Date("2027-01-05T08:00:00.000Z");

    // Act
    const periods = getMonthPeriods(now);

    // Assert
    expect(periods.monthStart.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(periods.previousStart.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(periods.previousEnd.toISOString()).toBe("2026-12-05T08:00:00.000Z");
  });
});

describe("getRelativeChange", () => {
  it.each([
    [120, 100, 0.2],
    [80, 100, -0.2],
    [100, 100, 0],
  ])("returns the change from %d vs %d", (current, previous, expected) => {
    // Act & Assert
    expect(getRelativeChange(current, previous)).toBeCloseTo(expected);
  });

  it.each([
    [100, 0],
    [100, null],
    [null, 100],
    [undefined, 100],
  ])("returns null when %p vs %p cannot be compared", (current, previous) => {
    // Act & Assert
    expect(getRelativeChange(current, previous)).toBeNull();
  });
});

describe("getAverage", () => {
  it("divides the total by the count", () => {
    // Act & Assert
    expect(getAverage(30000, 4)).toBe(7500);
  });

  it("returns null without orders", () => {
    // Act & Assert
    expect(getAverage(0, 0)).toBeNull();
    expect(getAverage(null, 3)).toBeNull();
  });
});

describe("getTopProducts", () => {
  const line = (
    productId: string | null,
    name: string,
    quantity: number,
    sku: string | null = null,
  ): OrderLineForRanking => ({
    quantity,
    productName: name,
    productSku: sku,
    variant: productId
      ? { id: `v-${productId}-${quantity}`, product: { id: productId, name } }
      : null,
  });

  it("rolls variants up into their product and ranks by units sold", () => {
    // Arrange
    const lines = [
      line("p1", "Shirt", 2),
      line("p2", "Ball", 5),
      line("p1", "Shirt", 4),
      line("p3", "Glove", 1),
    ];

    // Act
    const top = getTopProducts(lines, 2);

    // Assert
    expect(top).toEqual([
      { id: "p1", name: "Shirt", quantity: 6 },
      { id: "p2", name: "Ball", quantity: 5 },
    ]);
  });

  it("groups lines without a variant by product name, across variant SKUs", () => {
    // Arrange
    const lines = [line(null, "Old shoe", 1, "SKU-40"), line(null, "Old shoe", 2, "SKU-42")];

    // Act
    const top = getTopProducts(lines, 5);

    // Assert
    expect(top).toEqual([{ id: "unlinked:Old shoe", name: "Old shoe", quantity: 3 }]);
  });

  it("breaks ties by name", () => {
    // Arrange
    const lines = [line("p2", "B", 1), line("p1", "A", 1)];

    // Act & Assert
    expect(getTopProducts(lines, 5).map(product => product.name)).toEqual(["A", "B"]);
  });
});
