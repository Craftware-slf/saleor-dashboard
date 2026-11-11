import {
  getCategoryAncestorNames,
  getCategoryPathLabel,
  getCategoryPathPrefix,
} from "./categoryPath";

const node = (name: string, level: number): { node: { name: string; level: number } } => ({
  node: { name, level },
});

describe("categoryPath", () => {
  it("builds the full path with no truncation", () => {
    const category = {
      name: "Shirts",
      fullPath: {
        edges: [node("Örninn Hjól", 0), node("Outlet", 1), node("Men", 2)],
      },
    };

    expect(getCategoryPathLabel(category)).toBe("Örninn Hjól / Outlet / Men / Shirts");
    expect(getCategoryPathPrefix(category)).toBe("Örninn Hjól / Outlet / Men / ");
  });

  it("orders ancestors by level, not by response order", () => {
    // Saleor returns ancestors in ID order after a re-parent.
    const category = {
      name: "Shirts",
      fullPath: {
        edges: [node("Men", 2), node("Örninn Hjól", 0), node("Clothing", 1)],
      },
    };

    expect(getCategoryAncestorNames(category)).toEqual(["Örninn Hjól", "Clothing", "Men"]);
  });

  it("falls back to the bare name for a root category", () => {
    expect(getCategoryPathLabel({ name: "Örninn Golf Shop", fullPath: { edges: [] } })).toBe(
      "Örninn Golf Shop",
    );
    expect(getCategoryPathPrefix({ name: "Örninn Golf Shop", fullPath: { edges: [] } })).toBe("");
  });

  it("falls back to the bare name when the path was not fetched", () => {
    expect(getCategoryPathLabel({ name: "Shirts" })).toBe("Shirts");
    expect(getCategoryPathLabel({ name: "Shirts", fullPath: null })).toBe("Shirts");
  });
});
