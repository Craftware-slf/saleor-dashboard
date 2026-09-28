/**
 * Brand collections (Craftware / Örninn FEAT-206).
 *
 * Every brand is represented by one Saleor Collection that an external sync worker
 * maintains (slug `brand-<page slug>`, name `Brand: <title>`). The presence of the
 * `brand_page_id` metadata key is the marker of a brand collection. These collections are
 * unpublished and have no channel listings, so they must be searched WITHOUT a channel.
 *
 * In discount rules a Brand condition is saved as a plain `collectionPredicate: { ids }`,
 * and is told apart from a regular Collections condition on load by that metadata key.
 *
 * GraphQL documents can't interpolate this constant, so the literal key is repeated in
 * `SearchRuleConditionCollections` and `RuleConditionsSelectedOptionsDetails`.
 */
export const BRAND_COLLECTION_METADATA_KEY = "brand_page_id";

interface CollectionWithBrandMarker {
  brandPageId?: string | null;
}

export const isBrandCollection = (collection: CollectionWithBrandMarker): boolean =>
  !!collection.brandPageId;
