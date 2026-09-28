import { type CataloguePredicateInput } from "@dashboard/graphql";

import { type Condition, isArrayOfOptions } from "../Condition";

/**
 * Maps a condition id to its API predicate key. "brand" has no API counterpart: brands are
 * collections, so a Brand condition is saved as a plain `collectionPredicate`. When a rule has
 * both a Brand and a Collections condition they become two collectionPredicates OR-ed together,
 * like any other pair of conditions.
 */
function getPredicateKey(conditionId: string): string {
  if (conditionId === "brand") {
    return "collectionPredicate";
  }

  return `${conditionId}Predicate`;
}

export function prepareCataloguePredicate(conditions: Condition[]): CataloguePredicateInput {
  const ruleConditions = conditions
    .map(condition => {
      if (!condition.id) {
        return undefined;
      }

      if (Array.isArray(condition.value) && condition.value.length === 0) {
        return undefined;
      } else if (!condition.value) {
        return undefined;
      }

      return {
        [getPredicateKey(condition.id)]: {
          ids: isArrayOfOptions(condition.value)
            ? condition.value.map(val => val.value)
            : [condition.value],
        },
      };
    })
    .filter(Boolean) as CataloguePredicateInput[];

  if (ruleConditions.length === 0) {
    return {};
  }

  if (ruleConditions.length === 1) {
    return {
      ...ruleConditions[0],
    };
  }

  return {
    OR: ruleConditions,
  };
}
