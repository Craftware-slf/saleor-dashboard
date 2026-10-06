import { type MetadataItemFragment } from "@dashboard/graphql";

/**
 * How an Örninn order was paid for. The storefronts stamp it onto the checkout as PUBLIC
 * metadata `payment_method`, and Saleor copies it onto the order — see
 * `PAYMENT_METHOD_METADATA_KEY` / `PaidWithMethod` in packages/types of the orninn
 * monorepo. Krafa (B2B on account) is the one that matters at the pack step: nothing was
 * charged, and Örninn invoices it out of Business Central.
 */
export const PAYMENT_METHOD_METADATA_KEY = "payment_method";

export type KnownPaymentMethod = "krafa" | "teya" | "netgiro";

/**
 * The stamped payment method, or null when absent (orders placed before the stamp
 * existed carry none). An unrecognised value is returned as-is, so a method added to the
 * storefront later still shows rather than reading as "unknown".
 */
export const getPaymentMethod = (
  metadata: MetadataItemFragment[] | undefined | null,
): string | null => {
  const value = metadata
    ?.find(item => item.key === PAYMENT_METHOD_METADATA_KEY)
    ?.value?.trim()
    .toLowerCase();

  return value ? value : null;
};

export const isKnownPaymentMethod = (value: string): value is KnownPaymentMethod =>
  value === "krafa" || value === "teya" || value === "netgiro";
