import { type MetadataItemFragment } from "@dashboard/graphql";

/**
 * The buyer's kennitala (Icelandic national ID) is stamped onto the checkout as
 * PRIVATE metadata by the storefronts and copied onto the order by Saleor — see
 * `stampKennitalaOnCheckout` in apps/store-*\/src/app/api/checkout/shared.ts in the
 * orninn monorepo. Business Central then keys the customer card by that exact value
 * (odata-bc-writer.ts: `number: kt`), so it is read-only everywhere in this UI:
 * a hand-edit here silently breaks the order's link to its BC customer.
 *
 * Kept private rather than promoted to public metadata deliberately — a kennitala is
 * a national ID and public order metadata is readable by the customer.
 */
export const KENNITALA_METADATA_KEY = "kennitala";

/**
 * Pull the buyer's kennitala off an order's private metadata.
 *
 * Returns null when absent, which is a real case rather than an error: orders placed
 * before the field was captured (prod #2–#8) carry no private metadata at all.
 */
export const getKennitala = (
  privateMetadata: MetadataItemFragment[] | undefined | null,
): string | null => {
  const value = privateMetadata?.find(item => item.key === KENNITALA_METADATA_KEY)?.value?.trim();

  return value ? value : null;
};

/**
 * Render as DDMMYY-NNNN, the way a kennitala is written in Iceland. Stored values are
 * normalised to 10 bare digits by the storefront (`normalizeKennitala`), but anything
 * unexpected is shown verbatim rather than sliced into a misleading shape.
 */
export const formatKennitala = (kennitala: string): string =>
  /^\d{10}$/.test(kennitala) ? `${kennitala.slice(0, 6)}-${kennitala.slice(6)}` : kennitala;
