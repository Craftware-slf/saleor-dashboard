import { prepareQs } from "./qs";

describe("Filters: preapreQS", () => {
  it("should remove activeTab, action, sort, asc from query string", () => {
    const qs = prepareQs("?category=1&activeTab=1&channel=usa&action=save-search&sort=name&asc=4");

    expect(qs).toEqual({
      activeTab: "1",
      parsedQs: {
        category: "1",
        channel: "usa",
      },
    });
  });

  it("should remove the pagination cursors so a preset cannot be saved mid-list", () => {
    const qs = prepareQs(
      "?0[s0.channel]=hjol&sort=name&asc=true&after=WyJBY2N1IExFRCBSZW1vdGUiXQ==",
    );

    expect(qs).toEqual({
      activeTab: undefined,
      parsedQs: {
        "0": { "s0.channel": "hjol" },
      },
    });
  });

  it("should remove a `before` cursor as well", () => {
    const qs = prepareQs("?0[s0.channel]=hjol&before=WyJBY2N1IExFRCBSZW1vdGUiXQ==");

    expect(qs).toEqual({
      activeTab: undefined,
      parsedQs: {
        "0": { "s0.channel": "hjol" },
      },
    });
  });
});
