import { type CataloguePredicateAPI } from "@dashboard/discounts/types";

import { type Condition, type ConditionType } from "../Condition";

/**
 * @param brandCollectionIds ids of collections known to be brand collections. The API has no
 * brand predicate: a Brand condition is stored as a `collectionPredicate`, so its ids are
 * split back out of every collectionPredicate here. Until the ids are known (details still
 * loading) brand collections load as a Collections condition; callers re-derive conditions
 * once they arrive, so this is never persisted.
 */
export function prepareCatalogueRuleConditions(
  cataloguePredicate: CataloguePredicateAPI,
  ruleConditionsOptionsDetailsMap: Record<string, string>,
  brandCollectionIds: string[] = [],
): Condition[] {
  const toOptions = createToOptionMap(ruleConditionsOptionsDetailsMap);

  if (Array.isArray(cataloguePredicate)) {
    return cataloguePredicate.flatMap(predicate =>
      prepareCatalogueRuleConditions(
        predicate,
        ruleConditionsOptionsDetailsMap,
        brandCollectionIds,
      ),
    );
  }

  return Object.entries(cataloguePredicate)
    .flatMap(([key, value]) => {
      if (["OR", "AND"].includes(key)) {
        return prepareCatalogueRuleConditions(
          value,
          ruleConditionsOptionsDetailsMap,
          brandCollectionIds,
        );
      }

      if (key === "collectionPredicate") {
        return prepareCollectionConditions(value?.ids, toOptions, brandCollectionIds);
      }

      return {
        id: key.split("Predicate")[0],
        type: "is" as ConditionType, // Catalog predicate always has only "is" condition type
        value: value.ids?.map(toOptions) ?? [],
      };
    })
    .filter(Boolean);
}

/**
 * A collectionPredicate whose ids mix brand and regular collections yields two conditions:
 * "collection" (regular ids) and "brand" (brand ids).
 */
function prepareCollectionConditions(
  ids: string[] | undefined,
  toOptions: ReturnType<typeof createToOptionMap>,
  brandCollectionIds: string[],
): Condition[] {
  const brandIds = new Set(brandCollectionIds);
  const allIds = ids ?? [];
  const regularCollectionIds = allIds.filter(id => !brandIds.has(id));
  const brandCollectionIdsInPredicate = allIds.filter(id => brandIds.has(id));
  const conditions: Condition[] = [];

  // Keep the previous behaviour for an empty predicate: one (empty) Collections condition.
  if (regularCollectionIds.length > 0 || brandCollectionIdsInPredicate.length === 0) {
    conditions.push({
      id: "collection",
      type: "is",
      value: regularCollectionIds.map(toOptions),
    });
  }

  if (brandCollectionIdsInPredicate.length > 0) {
    conditions.push({
      id: "brand",
      type: "is",
      value: brandCollectionIdsInPredicate.map(toOptions),
    });
  }

  return conditions;
}

function createToOptionMap(ruleConditionsOptionsDetailsMap: Record<string, string>) {
  return (id: string) => ({
    label: ruleConditionsOptionsDetailsMap[id] || id,
    value: id,
  });
}
