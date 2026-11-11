import { getCategoryHierarchyLabel } from "./labels";

type Node = Parameters<typeof getCategoryHierarchyLabel>[0];

// Craftware (Örninn FEAT-263)
describe("getCategoryHierarchyLabel", () => {
  it("returns every ancestor, root first, when the full path was fetched", () => {
    const node = {
      name: "Shoes",
      level: 3,
      parent: { id: "p", name: "Men's Golf Apparel" },
      ancestors: { edges: [{ node: { id: "r", name: "Örninn Golf Shop" } }] },
      fullPath: {
        edges: [
          { node: { id: "p", name: "Men's Golf Apparel", level: 2 } },
          { node: { id: "r", name: "Örninn Golf Shop", level: 0 } },
          { node: { id: "c", name: "Clothing", level: 1 } },
        ],
      },
    } as unknown as Node;

    expect(getCategoryHierarchyLabel(node)).toBe(
      "Örninn Golf Shop / Clothing / Men's Golf Apparel",
    );
  });

  it("is empty for a root category", () => {
    const node = {
      name: "Örninn Golf Shop",
      level: 0,
      parent: null,
      ancestors: { edges: [] },
      fullPath: { edges: [] },
    } as unknown as Node;

    expect(getCategoryHierarchyLabel(node)).toBe("");
  });
});
