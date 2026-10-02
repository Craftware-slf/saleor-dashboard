/**
 * Default for `Shop.useLegacyShippingZoneStockAvailability` when the shop
 * fragment hasn't loaded yet (or wasn't passed by a caller).
 *
 * Set to `true` so that, until we know otherwise, the doctor renders the
 * legacy-mode severity levels and copy and we don't transiently downgrade
 * warnings on a fresh page load.
 *
 * This is the single place to flip the doctor-wide default once the new
 * direct warehouse-channel mode becomes the standard — every consumer in
 * the ProductDoctor folder that needs a fallback reads from here, so the
 * change is one line.
 */
export const LEGACY_MODE_FALLBACK = true;

/**
 * Craftware (Örninn FEAT-218): slug of the product type every bundle is created as.
 * A bundle is sold as its PARTS — its only variant is a SKU-less placeholder that
 * deliberately has no stock, so Saleor never sells it on its own. The stock checks
 * and the public-API "no variants in stock" verdict are therefore expected for it,
 * not a problem to fix. Must match BUNDLE_PRODUCT_TYPE_SLUG in the Örninn repo.
 */
export const BUNDLE_PRODUCT_TYPE_SLUG = "bundle";
