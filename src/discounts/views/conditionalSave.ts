import {
  CONDITIONAL_RULE_KEY,
  parseConditionalRule,
} from "@dashboard/discounts/conditional/conditionalRule";
import {
  conditionalFormToStored,
  type ConditionalFormValues,
} from "@dashboard/discounts/conditional/form";

/** The two writes a conditional discount needs, injected so the order is testable. */
export interface ConditionalWriter {
  /** Writes `orninn_conditional`; resolves to the number of errors. */
  writeMetadata: (promotionId: string, value: string) => Promise<number>;
  /**
   * A promotionUpdate after the metadata write. A bare updateMetadata fires no promotion
   * webhook, so without it the Örninn sync worker would only see the rule on its next poll.
   */
  touchPromotion: (promotionId: string, name: string) => Promise<number>;
}

/**
 * The JSON to store, or null when the storefront's parser would reject it (never write
 * that — the rule would silently do nothing).
 */
export function storedConditionalValue(form: ConditionalFormValues): string | null {
  const stored = conditionalFormToStored(form);
  const accepted = parseConditionalRule({ ...stored, id: "check", startDate: null, endDate: null });

  return accepted ? JSON.stringify(stored) : null;
}

/** Writes a new rule's metadata, then touches the promotion. Resolves true on success. */
export async function writeConditionalRule(
  writer: ConditionalWriter,
  promotionId: string,
  name: string,
  form: ConditionalFormValues,
): Promise<boolean> {
  const value = storedConditionalValue(form);

  if (value === null) {
    return false;
  }

  if ((await writer.writeMetadata(promotionId, value)) > 0) {
    return false;
  }

  return (await writer.touchPromotion(promotionId, name)) === 0;
}

/** The writer backed by the dashboard's UpdateMetadata and PromotionUpdate mutations. */
export function makeConditionalWriter(
  updateMetadata: (
    id: string,
    input: Array<{ key: string; value: string }>,
  ) => Promise<{ errors: number }>,
  promotionUpdate: (id: string, name: string) => Promise<{ errors: number }>,
): ConditionalWriter {
  return {
    writeMetadata: async (promotionId, value) =>
      (await updateMetadata(promotionId, [{ key: CONDITIONAL_RULE_KEY, value }])).errors,
    touchPromotion: async (promotionId, name) => (await promotionUpdate(promotionId, name)).errors,
  };
}
