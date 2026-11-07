import { storedConditionalValue, writeConditionalRule } from "../views/conditionalSave";
import {
  type ConditionalRule,
  describeConditionalRule,
  parseConditionalRule,
} from "./conditionalRule";
import {
  automaticConditionalText,
  conditionalFormFromStored,
  conditionalFormToStored,
  type ConditionalFormValues,
  emptyConditionalForm,
  getStoredConditionalValue,
  parseTiers,
  validateConditionalForm,
} from "./form";

const GOLF_BALLS = "Q2F0ZWdvcnk6MjIwNQ==";

// The rule stored on the local FEAT-246 test promotion, verbatim.
const storedGolfBalls = JSON.stringify({
  channels: ["golf"],
  condition: {
    items: { products: [], variants: [], categories: [GOLF_BALLS], collections: [] },
    minQuantity: 4,
    sameProduct: true,
  },
  reward: {
    discount: { kind: "percentage", value: 15 },
    target: "same",
    quantity: "group",
    repeat: true,
  },
  label: { is: "Tylft af golfkúlum á 15% afslætti!" },
});

const form = (patch: Partial<ConditionalFormValues>): ConditionalFormValues => ({
  ...emptyConditionalForm(),
  channels: ["golf"],
  categories: [GOLF_BALLS],
  ...patch,
});

const rule = (patch: Partial<ConditionalFormValues>): ConditionalRule => {
  const parsed = parseConditionalRule({
    ...conditionalFormToStored(form(patch)),
    id: "p",
    startDate: null,
    endDate: null,
  });

  if (!parsed) {
    throw new Error("rule did not parse");
  }

  return parsed;
};

describe("conditional discount form ⇄ stored JSON", () => {
  it("loads a stored rule into the form", () => {
    const loaded = conditionalFormFromStored(storedGolfBalls);

    expect(loaded).toMatchObject({
      channels: ["golf"],
      categories: [GOLF_BALLS],
      products: [],
      sameProduct: true,
      mode: "every",
      minQuantity: "4",
      repeat: true,
      discountKind: "percentage",
      discountValue: "15",
      labelIs: "Tylft af golfkúlum á 15% afslætti!",
      labelEn: "",
      unsupported: null,
    });
  });

  it("round-trips a stored rule unchanged", () => {
    const stored = conditionalFormToStored(conditionalFormFromStored(storedGolfBalls));

    expect(JSON.stringify(stored)).toBe(storedGolfBalls);
  });

  it("keeps unknown keys and variant ids it does not show", () => {
    const raw = JSON.stringify({
      ...JSON.parse(storedGolfBalls),
      note: "kept",
      condition: {
        ...JSON.parse(storedGolfBalls).condition,
        items: { products: [], variants: ["VmFyOjE="], categories: [GOLF_BALLS], collections: [] },
        extra: 1,
      },
    });
    const loaded = conditionalFormFromStored(raw);
    const stored = conditionalFormToStored({ ...loaded, labelEn: "Buy a dozen" }) as any;

    expect(stored.note).toBe("kept");
    expect(stored.condition.extra).toBe(1);
    expect(stored.condition.items.variants).toEqual(["VmFyOjE="]);
    expect(stored.label).toEqual({ is: "Tylft af golfkúlum á 15% afslætti!", en: "Buy a dozen" });
  });

  it("writes every N units as a repeating group", () => {
    expect(conditionalFormToStored(form({ minQuantity: "4", discountValue: "15" }))).toEqual({
      channels: ["golf"],
      condition: {
        items: { products: [], variants: [], categories: [GOLF_BALLS], collections: [] },
        minQuantity: 4,
        sameProduct: true,
      },
      reward: {
        discount: { kind: "percentage", value: 15 },
        target: "same",
        quantity: "group",
        repeat: true,
      },
    });
  });

  it("writes a quantity list as sorted unique tiers with minQuantity = the smallest", () => {
    const stored = conditionalFormToStored(
      form({ mode: "tiers", tiers: "16, 8 12,8", discountValue: "15", repeat: true }),
    ) as any;

    expect(stored.condition.tiers).toEqual([8, 12, 16]);
    expect(stored.condition.minQuantity).toBe(8);
    expect(stored.reward).toMatchObject({ quantity: "group", repeat: false });
  });

  it("writes buy N get M free", () => {
    const stored = conditionalFormToStored(
      form({ mode: "buyget", minQuantity: "2", rewardQuantity: "1", discountKind: "free" }),
    ) as any;

    expect(stored.condition.minQuantity).toBe(2);
    expect(stored.condition.tiers).toBeUndefined();
    expect(stored.reward).toEqual({
      discount: { kind: "free" },
      target: "same",
      quantity: 1,
      repeat: true,
    });
  });

  it("drops tiers and an empty label when they no longer apply", () => {
    const loaded = conditionalFormFromStored(
      JSON.stringify({
        ...JSON.parse(storedGolfBalls),
        condition: { ...JSON.parse(storedGolfBalls).condition, tiers: [8, 12] },
      }),
    );

    expect(loaded.mode).toBe("tiers");

    const stored = conditionalFormToStored({ ...loaded, mode: "every", labelIs: "  " }) as any;

    expect(stored.condition.tiers).toBeUndefined();
    expect(stored.label).toBeUndefined();
  });

  it("marks quantity 'all' and cross-sell rules read-only", () => {
    const base = JSON.parse(storedGolfBalls);

    expect(
      conditionalFormFromStored(
        JSON.stringify({ ...base, reward: { ...base.reward, quantity: "all" } }),
      ).unsupported,
    ).toBe("quantityAll");
    expect(
      conditionalFormFromStored(
        JSON.stringify({
          ...base,
          reward: { ...base.reward, quantity: 1, target: { products: ["x"] } },
        }),
      ).unsupported,
    ).toBe("crossSell");
    expect(conditionalFormFromStored("{not json").unsupported).toBe("unreadable");
  });

  it("finds the rule in promotion metadata", () => {
    expect(
      getStoredConditionalValue([
        { key: "other", value: "1" },
        { key: "orninn_conditional", value: "{}" },
      ]),
    ).toBe("{}");
    expect(getStoredConditionalValue([])).toBeUndefined();
  });
});

describe("conditional discount validation", () => {
  it("accepts a complete form", () => {
    expect(validateConditionalForm(form({ minQuantity: "4", discountValue: "15" }))).toEqual({});
  });

  it("needs a channel and at least one item", () => {
    expect(
      validateConditionalForm(
        form({ channels: [], categories: [], minQuantity: "4", discountValue: "15" }),
      ),
    ).toEqual({ channels: "required", items: "noItems" });
  });

  it("counts preserved variant ids as items", () => {
    expect(
      validateConditionalForm(
        form({
          categories: [],
          minQuantity: "4",
          discountValue: "15",
          original: { condition: { items: { variants: ["v"] } } },
        }),
      ),
    ).toEqual({});
  });

  it("needs whole positive quantities", () => {
    expect(validateConditionalForm(form({ minQuantity: "0", discountValue: "15" }))).toEqual({
      minQuantity: "positiveInt",
    });
    expect(validateConditionalForm(form({ minQuantity: "2.5", discountValue: "15" }))).toEqual({
      minQuantity: "positiveInt",
    });
    expect(
      validateConditionalForm(
        form({ mode: "buyget", minQuantity: "2", rewardQuantity: "", discountKind: "free" }),
      ),
    ).toEqual({ rewardQuantity: "positiveInt" });
    expect(
      validateConditionalForm(form({ mode: "tiers", tiers: "8, x", discountValue: "15" })),
    ).toEqual({ tiers: "tiers" });
  });

  it("bounds percentages and keeps krónur whole", () => {
    expect(validateConditionalForm(form({ minQuantity: "4", discountValue: "101" }))).toEqual({
      discountValue: "percentage",
    });
    expect(validateConditionalForm(form({ minQuantity: "4", discountValue: "0" }))).toEqual({
      discountValue: "percentage",
    });
    expect(validateConditionalForm(form({ minQuantity: "4", discountValue: "12.5" }))).toEqual({});
    expect(
      validateConditionalForm(
        form({ minQuantity: "4", discountKind: "fixed", discountValue: "499.5" }),
      ),
    ).toEqual({ discountValue: "fixed" });
  });

  it("only allows free with buy N get M", () => {
    expect(validateConditionalForm(form({ minQuantity: "4", discountKind: "free" }))).toEqual({
      discountKind: "freeNeedsBuyGet",
    });
  });

  it("parses tier lists", () => {
    expect(parseTiers("12; 8 16")).toEqual([8, 12, 16]);
    expect(parseTiers("")).toBeNull();
    expect(parseTiers("8, -1")).toBeNull();
  });

  it("only produces JSON the storefront parser accepts", () => {
    expect(storedConditionalValue(form({ minQuantity: "4", discountValue: "15" }))).not.toBeNull();
    expect(storedConditionalValue(form({ minQuantity: "", discountValue: "15" }))).toBeNull();
  });
});

describe("describeConditionalRule port", () => {
  it("every 4 at 15%, repeating", () => {
    const r = rule({ minQuantity: "4", discountValue: "15" });

    expect(describeConditionalRule(r, "is")).toBe(
      "Kauptu 4 og fáðu 15% afslátt — af hverjum 4 stk.",
    );
    expect(describeConditionalRule(r, "en")).toBe("Buy 4, get 15% off — on every 4");
  });

  it("tiers 8, 12, 16", () => {
    const r = rule({ mode: "tiers", tiers: "8, 12, 16", discountValue: "15" });

    expect(describeConditionalRule(r, "is")).toBe("Kauptu 8, 12 eða 16 og fáðu 15% afslátt");
    expect(describeConditionalRule(r, "en")).toBe("Buy 8, 12 or 16 and get 15% off");
  });

  it("buy 2 get 1 free", () => {
    const r = rule({ mode: "buyget", minQuantity: "2", rewardQuantity: "1", discountKind: "free" });

    expect(describeConditionalRule(r, "is")).toBe("Kauptu 2, fáðu 1 frítt");
    expect(describeConditionalRule(r, "en")).toBe("Buy 2, get 1 free");
  });

  it("appends mix and match when the units may differ", () => {
    const r = rule({ minQuantity: "4", discountValue: "15", sameProduct: false });

    expect(describeConditionalRule(r, "is")).toBe(
      "Kauptu 4 og fáðu 15% afslátt — af hverjum 4 stk. — má blanda vörum",
    );
    expect(describeConditionalRule(r, "en")).toBe(
      "Buy 4, get 15% off — on every 4 — mix and match",
    );
  });

  it("prefers staff's own label; the automatic text ignores it", () => {
    const f = form({ minQuantity: "4", discountValue: "15", labelIs: "Tylft!" });

    expect(describeConditionalRule(rule(f), "is")).toBe("Tylft!");
    expect(automaticConditionalText(f, "is")).toBe(
      "Kauptu 4 og fáðu 15% afslátt — af hverjum 4 stk.",
    );
    expect(automaticConditionalText(form({ minQuantity: "" }), "is")).toBeNull();
  });

  it("formats krónur with dot thousands", () => {
    const r = rule({
      minQuantity: "3",
      discountKind: "fixed",
      discountValue: "1500",
      repeat: false,
    });

    expect(describeConditionalRule(r, "is")).toBe("Kauptu 3 og fáðu 1.500 kr. afslátt á stk.");
    expect(describeConditionalRule(r, "en")).toBe("Buy 3, get 1.500 kr. off each");
  });
});

describe("writeConditionalRule", () => {
  it("writes metadata, then touches the promotion so its webhook fires", async () => {
    const calls: string[] = [];
    const ok = await writeConditionalRule(
      {
        writeMetadata: async (id, value) => {
          calls.push(`metadata ${id} ${JSON.parse(value).channels[0]}`);

          return 0;
        },
        touchPromotion: async (id, name) => {
          calls.push(`update ${id} ${name}`);

          return 0;
        },
      },
      "P1",
      "Name",
      form({ minQuantity: "4", discountValue: "15" }),
    );

    expect(ok).toBe(true);
    expect(calls).toEqual(["metadata P1 golf", "update P1 Name"]);
  });

  it("writes nothing for an invalid form", async () => {
    const writeMetadata = jest.fn(async () => 0);
    const ok = await writeConditionalRule(
      { writeMetadata, touchPromotion: jest.fn(async () => 0) },
      "P1",
      "Name",
      form({ minQuantity: "" }),
    );

    expect(ok).toBe(false);
    expect(writeMetadata).not.toHaveBeenCalled();
  });
});
