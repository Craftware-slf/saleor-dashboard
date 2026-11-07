// Conditional discounts (Örninn FEAT-246).
//
// A port of the storage contract in the Örninn monorepo
// (`packages/types/src/conditional-discount.ts`): the dashboard cannot import
// `@orninn/types`, so the parser and the banner sentence are copied here. Keep the two in
// step — the storefront drops a rule its parser rejects, so `parseConditionalRule` here is
// the gate that stops the dashboard writing a rule that would silently do nothing.
//
// A conditional discount is a Saleor ORDER promotion with no Saleor rules (so Saleor itself
// applies nothing). Its condition and reward live as JSON in the promotion's public
// metadata under CONDITIONAL_RULE_KEY; the Örninn sync worker compiles them into channel
// metadata and the storefront prices the cart with them.

/** Promotion metadata key holding one rule as JSON. */
export const CONDITIONAL_RULE_KEY = "orninn_conditional";

export interface ItemSet {
  products: string[];
  variants: string[];
  categories: string[];
  collections: string[];
}

export type ConditionalReward =
  | { kind: "percentage"; value: number }
  | { kind: "fixed"; value: number }
  | { kind: "free" };

export interface ConditionalRule {
  id: string;
  name: string;
  channels: string[];
  startDate: string | null;
  endDate: string | null;
  label?: { is?: string; en?: string };
  condition: {
    items: ItemSet;
    minQuantity: number;
    sameProduct: boolean;
    tiers?: number[];
  };
  reward: {
    discount: ConditionalReward;
    target: "same" | ItemSet;
    quantity: number | "all" | "group";
    repeat: boolean;
  };
}

export type ConditionalLocale = "is" | "en";

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

export function idList(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return [...new Set(raw.filter((x): x is string => typeof x === "string" && x.trim() !== ""))];
}

function parseItemSet(raw: unknown): ItemSet | null {
  if (!isRecord(raw)) {
    return null;
  }

  const set: ItemSet = {
    products: idList(raw.products),
    variants: idList(raw.variants),
    categories: idList(raw.categories),
    collections: idList(raw.collections),
  };
  const size =
    set.products.length + set.variants.length + set.categories.length + set.collections.length;

  return size === 0 ? null : set;
}

function parseDiscount(raw: unknown): ConditionalReward | null {
  if (!isRecord(raw)) {
    return null;
  }

  const { kind, value } = raw;

  if (kind === "free") {
    return { kind: "free" };
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (kind === "percentage") {
    return value <= 100 ? { kind, value } : null;
  }

  // ISK is zero-decimal.
  if (kind === "fixed") {
    return Number.isInteger(value) ? { kind, value } : null;
  }

  return null;
}

function positiveInt(raw: unknown): number | null {
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 ? raw : null;
}

function isoOrNull(raw: unknown): string | null | undefined {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
    return undefined;
  }

  return raw;
}

function parseLabel(raw: unknown): ConditionalRule["label"] {
  if (!isRecord(raw)) {
    return undefined;
  }

  const out: { is?: string; en?: string } = {};

  for (const k of ["is", "en"] as const) {
    const v = raw[k];

    if (typeof v === "string" && v.trim() !== "") {
      out[k] = v.trim();
    }
  }

  return out.is !== undefined || out.en !== undefined ? out : undefined;
}

/** A rule from stored JSON (with id/name/dates merged in), or null when the storefront would drop it. */
export function parseConditionalRule(raw: unknown): ConditionalRule | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = typeof raw.id === "string" ? raw.id : "";

  if (id === "") {
    return null;
  }

  const channels = idList(raw.channels);

  if (channels.length === 0) {
    return null;
  }

  const startDate = isoOrNull(raw.startDate);
  const endDate = isoOrNull(raw.endDate);

  if (startDate === undefined || endDate === undefined) {
    return null;
  }

  const cond = raw.condition;

  if (!isRecord(cond)) {
    return null;
  }

  const items = parseItemSet(cond.items);
  let tiers: number[] | undefined;

  if (cond.tiers !== undefined && cond.tiers !== null) {
    const rawTiers = cond.tiers;

    if (!Array.isArray(rawTiers) || rawTiers.length === 0) {
      return null;
    }

    const parsed = rawTiers.map(positiveInt);

    if (parsed.some(t => t === null)) {
      return null;
    }

    tiers = [...new Set(parsed as number[])].sort((a, b) => a - b);
  }

  const minQuantity = tiers ? (tiers[0] ?? null) : positiveInt(cond.minQuantity);

  if (items === null || minQuantity === null) {
    return null;
  }

  const rew = raw.reward;

  if (!isRecord(rew)) {
    return null;
  }

  const discount = parseDiscount(rew.discount);

  if (discount === null) {
    return null;
  }

  const target = rew.target === "same" ? "same" : parseItemSet(rew.target);

  if (target === null) {
    return null;
  }

  const quantity =
    rew.quantity === "all" || rew.quantity === "group" ? rew.quantity : positiveInt(rew.quantity);

  if (quantity === null) {
    return null;
  }

  if (quantity === "group" && target !== "same") {
    return null;
  }

  if (tiers && quantity !== "group") {
    return null;
  }

  const label = parseLabel(raw.label);

  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "",
    channels,
    startDate,
    endDate,
    ...(label ? { label } : {}),
    condition: {
      items,
      minQuantity,
      sameProduct: cond.sameProduct === true,
      ...(tiers ? { tiers } : {}),
    },
    reward: { discount, target, quantity, repeat: rew.repeat === true },
  };
}

const kr = (n: number): string =>
  `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} kr.`;

function listOf(ns: readonly number[], and: string): string {
  const s = ns.map(String);

  return s.length <= 1
    ? (s[0] ?? "")
    : `${s.slice(0, -1).join(", ")} ${and} ${s[s.length - 1] ?? ""}`;
}

function offText(d: ConditionalReward, is: boolean): string {
  if (d.kind === "percentage") {
    return is ? `${String(d.value)}% afslátt` : `${String(d.value)}% off`;
  }

  if (d.kind === "fixed") {
    return is ? `${kr(d.value)} afslátt á stk.` : `${kr(d.value)} off each`;
  }

  return is ? "frítt" : "free";
}

/**
 * The shopper-facing one-liner: the rule's own label for that locale when staff wrote one,
 * otherwise written from the rule. Null for a cross-sell rule. Same logic as the storefront.
 */
export function describeConditionalRule(
  rule: ConditionalRule,
  locale: ConditionalLocale,
): string | null {
  const own = rule.label?.[locale];

  if (own !== undefined) {
    return own;
  }

  const { condition, reward } = rule;

  if (reward.target !== "same") {
    return null;
  }

  const is = locale === "is";
  const n = String(condition.minQuantity);
  const d = reward.discount;
  const off = offText(d, is);
  const mix = condition.sameProduct ? "" : is ? " — má blanda vörum" : " — mix and match";

  return describeQuantity(rule, is, n, off) + mix;
}

function describeQuantity(rule: ConditionalRule, is: boolean, n: string, off: string): string {
  const { condition, reward } = rule;
  const d = reward.discount;

  if (reward.quantity === "group") {
    if (condition.tiers && condition.tiers.length > 1) {
      return is
        ? `Kauptu ${listOf(condition.tiers, "eða")} og fáðu ${off}`
        : `Buy ${listOf(condition.tiers, "or")} and get ${off}`;
    }

    if (reward.repeat) {
      return is
        ? `Kauptu ${n} og fáðu ${off} — af hverjum ${n} stk.`
        : `Buy ${n}, get ${off} — on every ${n}`;
    }

    return is ? `Kauptu ${n} og fáðu ${off}` : `Buy ${n}, get ${off}`;
  }

  if (reward.quantity === "all") {
    return is
      ? `Kauptu ${n} eða fleiri og fáðu ${off} af öllum`
      : `Buy ${n} or more, get ${off} on all`;
  }

  const m = reward.quantity;

  if (d.kind === "free") {
    return is
      ? `Kauptu ${n}, fáðu ${String(m)} ${m === 1 ? "frítt" : "frí"}`
      : `Buy ${n}, get ${String(m)} free`;
  }

  const offDative =
    d.kind === "percentage" ? `${String(d.value)}% afslætti` : `${kr(d.value)} afslætti`;

  return is
    ? `Kauptu ${n}, fáðu ${String(m)} til viðbótar með ${offDative}`
    : `Buy ${n}, get ${String(m)} more at ${off}`;
}
