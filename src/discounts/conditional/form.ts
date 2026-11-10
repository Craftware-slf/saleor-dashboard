// The Conditional discount card's form values ⇄ the stored `orninn_conditional` JSON.
// Pure, so it is unit-tested without React (see form.test.ts).

import {
  CONDITIONAL_RULE_KEY,
  type ConditionalRule,
  describeConditionalRule,
  idList,
  parseConditionalRule,
} from "./conditionalRule";

/** UI-only discount type: saved as an ORDER promotion with no rules + metadata. */
export const CONDITIONAL_DISCOUNT_TYPE = "CONDITIONAL" as const;

export type QuantityMode = "every" | "tiers" | "buyget";
export type DiscountKind = "percentage" | "fixed" | "free";

/** Why a stored rule is shown read-only instead of being edited (and possibly corrupted). */
export type UnsupportedReason = "quantityAll" | "crossSell" | "unreadable";

export interface ConditionalFormValues {
  /** Channel slugs. */
  channels: string[];
  products: string[];
  categories: string[];
  collections: string[];
  /** Brand Page ids (FEAT-257) — picked through the brand collections, stored as the page ids. */
  brands: string[];
  /**
   * Product ids the rule never covers, even when a product, category, collection or brand
   * above matches them (FEAT-260) — "every Srixon ball except the Trispeed dozen".
   */
  excludedProducts: string[];
  sameProduct: boolean;
  mode: QuantityMode;
  /** N of "every N" and "buy N". Strings, as typed. */
  minQuantity: string;
  /** "8, 12, 16" */
  tiers: string;
  /** M of "get M". */
  rewardQuantity: string;
  repeat: boolean;
  discountKind: DiscountKind;
  discountValue: string;
  labelIs: string;
  labelEn: string;
  /** The stored JSON as loaded: unknown keys and variant ids ride along on save. */
  original: Record<string, unknown> | null;
  unsupported: UnsupportedReason | null;
}

export type ConditionalField =
  | "channels"
  | "items"
  | "minQuantity"
  | "tiers"
  | "rewardQuantity"
  | "discountValue"
  | "discountKind";

export type ConditionalErrorCode =
  | "required"
  | "noItems"
  | "positiveInt"
  | "tiers"
  | "percentage"
  | "fixed"
  | "freeNeedsBuyGet";

export type ConditionalErrors = Partial<Record<ConditionalField, ConditionalErrorCode>>;

export const emptyConditionalForm = (): ConditionalFormValues => ({
  channels: [],
  products: [],
  categories: [],
  collections: [],
  brands: [],
  excludedProducts: [],
  sameProduct: true,
  mode: "every",
  minQuantity: "",
  tiers: "",
  rewardQuantity: "1",
  repeat: true,
  discountKind: "percentage",
  discountValue: "",
  labelIs: "",
  labelEn: "",
  original: null,
  unsupported: null,
});

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

const record = (raw: unknown): Record<string, unknown> => (isRecord(raw) ? raw : {});

const numberText = (raw: unknown): string =>
  typeof raw === "number" && Number.isFinite(raw) ? String(raw) : "";

/** The stored JSON string for a promotion, or undefined when it is not a conditional discount. */
export function getStoredConditionalValue(
  metadata: ReadonlyArray<{ key: string; value: string }> | null | undefined,
): string | undefined {
  return metadata?.find(m => m.key === CONDITIONAL_RULE_KEY)?.value;
}

/** Form values for a stored rule. Lenient: whatever cannot be read is left at its default. */
export function conditionalFormFromStored(raw: string): ConditionalFormValues {
  const form = emptyConditionalForm();
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...form, unsupported: "unreadable" };
  }

  if (!isRecord(parsed)) {
    return { ...form, unsupported: "unreadable" };
  }

  const condition = record(parsed.condition);
  const items = record(condition.items);
  const reward = record(parsed.reward);
  const discount = record(reward.discount);
  const label = record(parsed.label);
  const tiers = Array.isArray(condition.tiers) ? condition.tiers : null;
  const quantity = reward.quantity;

  let mode: QuantityMode = "buyget";

  if (quantity === "group") {
    mode = tiers ? "tiers" : "every";
  }

  let unsupported: UnsupportedReason | null = null;

  if (reward.target !== undefined && reward.target !== "same") {
    unsupported = "crossSell";
  } else if (quantity === "all") {
    unsupported = "quantityAll";
  }

  const kind: DiscountKind =
    discount.kind === "fixed" || discount.kind === "free" ? discount.kind : "percentage";

  return {
    channels: idList(parsed.channels),
    products: idList(items.products),
    categories: idList(items.categories),
    collections: idList(items.collections),
    brands: idList(items.brands),
    excludedProducts: idList(parsed.excludedProducts),
    sameProduct: condition.sameProduct === true,
    mode,
    minQuantity: numberText(condition.minQuantity),
    tiers: tiers ? tiers.map(numberText).filter(Boolean).join(", ") : "",
    rewardQuantity: typeof quantity === "number" ? numberText(quantity) : form.rewardQuantity,
    repeat: reward.repeat === true,
    discountKind: kind,
    discountValue: kind === "free" ? "" : numberText(discount.value),
    labelIs: typeof label.is === "string" ? label.is : "",
    labelEn: typeof label.en === "string" ? label.en : "",
    original: parsed,
    unsupported,
  };
}

/** A whole number ≥ 1 typed as text, or null. */
function parsePositiveInt(text: string): number | null {
  const t = text.trim();

  if (!/^\d+$/.test(t)) {
    return null;
  }

  const n = Number(t);

  return n >= 1 ? n : null;
}

/** "8, 12 16" → [8, 12, 16] (sorted, unique), or null when any entry is not a whole number ≥ 1. */
export function parseTiers(text: string): number[] | null {
  const parts = text.split(/[\s,;]+/).filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const ns = parts.map(parsePositiveInt);

  if (ns.some(n => n === null)) {
    return null;
  }

  return [...new Set(ns as number[])].sort((a, b) => a - b);
}

function parseDiscountValue(kind: DiscountKind, text: string): number | null {
  if (kind === "free") {
    return null;
  }

  const t = text.trim().replace(",", ".");

  if (t === "" || !/^\d+(\.\d+)?$/.test(t)) {
    return null;
  }

  const v = Number(t);

  if (kind === "percentage") {
    return v > 0 && v <= 100 ? v : null;
  }

  return Number.isInteger(v) && v > 0 ? v : null;
}

/** Inline errors; empty when the form can be saved. Mirrors parseConditionalRule. */
export function validateConditionalForm(form: ConditionalFormValues): ConditionalErrors {
  const errors: ConditionalErrors = {};

  if (form.unsupported) {
    return errors;
  }

  if (form.channels.length === 0) {
    errors.channels = "required";
  }

  const variants = idList(record(record(form.original?.condition).items).variants);
  const itemCount =
    form.products.length +
    form.categories.length +
    form.collections.length +
    form.brands.length +
    variants.length;

  if (itemCount === 0) {
    errors.items = "noItems";
  }

  if (form.mode === "tiers") {
    if (parseTiers(form.tiers) === null) {
      errors.tiers = "tiers";
    }
  } else if (parsePositiveInt(form.minQuantity) === null) {
    errors.minQuantity = "positiveInt";
  }

  if (form.mode === "buyget" && parsePositiveInt(form.rewardQuantity) === null) {
    errors.rewardQuantity = "positiveInt";
  }

  if (form.discountKind === "free") {
    if (form.mode !== "buyget") {
      errors.discountKind = "freeNeedsBuyGet";
    }
  } else if (parseDiscountValue(form.discountKind, form.discountValue) === null) {
    errors.discountValue = form.discountKind === "percentage" ? "percentage" : "fixed";
  }

  return errors;
}

/**
 * The JSON to store for a valid form. Keys the dashboard does not edit (and variant ids,
 * which it does not show) are kept from the loaded rule.
 */
export function conditionalFormToStored(form: ConditionalFormValues): Record<string, unknown> {
  const original = form.original ?? {};
  const condition = record(original.condition);
  const items = record(condition.items);
  const reward = record(original.reward);
  const tiers = form.mode === "tiers" ? (parseTiers(form.tiers) ?? []) : null;
  const minQuantity = tiers ? (tiers[0] ?? 0) : (parsePositiveInt(form.minQuantity) ?? 0);
  const value = parseDiscountValue(form.discountKind, form.discountValue);

  const { tiers: _droppedTiers, ...conditionRest } = condition;
  const nextCondition: Record<string, unknown> = {
    ...conditionRest,
    items: {
      ...items,
      products: form.products,
      variants: idList(items.variants),
      categories: form.categories,
      collections: form.collections,
      // Written only once used, so a rule saved before brands existed round-trips unchanged.
      ...(form.brands.length > 0 || "brands" in items ? { brands: form.brands } : {}),
    },
    minQuantity,
    sameProduct: form.sameProduct,
    ...(tiers ? { tiers } : {}),
  };

  const nextReward: Record<string, unknown> = {
    ...reward,
    discount:
      form.discountKind === "free"
        ? { kind: "free" }
        : { kind: form.discountKind, value: value ?? 0 },
    target: "same",
    quantity: form.mode === "buyget" ? (parsePositiveInt(form.rewardQuantity) ?? 0) : "group",
    repeat: form.mode === "tiers" ? false : form.repeat,
  };

  const labelIs = form.labelIs.trim();
  const labelEn = form.labelEn.trim();
  const label = {
    ...(labelIs ? { is: labelIs } : {}),
    ...(labelEn ? { en: labelEn } : {}),
  };
  const { label: _droppedLabel, excludedProducts: _droppedExcluded, ...rest } = original;

  return {
    ...rest,
    channels: form.channels,
    // Written only once used, so a rule saved before exclusions existed round-trips unchanged.
    ...(form.excludedProducts.length > 0 || "excludedProducts" in original
      ? { excludedProducts: form.excludedProducts }
      : {}),
    condition: nextCondition,
    reward: nextReward,
    ...(labelIs || labelEn ? { label } : {}),
  };
}

/**
 * The rule as the storefront will read it, or null when the form is not valid yet (or the
 * storefront's parser would reject it — the last gate before writing).
 */
export function conditionalFormToRule(form: ConditionalFormValues): ConditionalRule | null {
  if (form.unsupported) {
    return parseConditionalRule({
      ...(form.original ?? {}),
      id: "preview",
      startDate: null,
      endDate: null,
    });
  }

  if (Object.keys(validateConditionalForm(form)).length > 0) {
    return null;
  }

  return parseConditionalRule({
    ...conditionalFormToStored(form),
    id: "preview",
    startDate: null,
    endDate: null,
  });
}

/** The automatic banner sentence (ignoring any label staff typed), or null when not computable. */
export function automaticConditionalText(
  form: ConditionalFormValues,
  locale: "is" | "en",
): string | null {
  const rule = conditionalFormToRule(form);

  if (!rule) {
    return null;
  }

  const { label: _label, ...withoutLabel } = rule;

  return describeConditionalRule(withoutLabel, locale);
}
