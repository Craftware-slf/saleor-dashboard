import { createCategoryOptionsFromAPI } from "./Handler";

// Craftware (Örninn FEAT-263)
describe("createCategoryOptionsFromAPI", () => {
  it("labels each category with its full path and keeps the slug as filter value", () => {
    expect(
      createCategoryOptionsFromAPI([
        {
          node: {
            id: "1",
            name: "Kids",
            slug: "kids-2",
            fullPath: {
              edges: [
                { node: { name: "Bikes", level: 1 } },
                { node: { name: "Örninn Bicycles", level: 0 } },
              ],
            },
          },
        },
        { node: { id: "2", name: "Örninn Golf Shop", slug: "golf", fullPath: { edges: [] } } },
      ]),
    ).toEqual([
      { label: "Örninn Bicycles / Bikes / Kids", value: "1", slug: "kids-2" },
      { label: "Örninn Golf Shop", value: "2", slug: "golf" },
    ]);
  });
});
