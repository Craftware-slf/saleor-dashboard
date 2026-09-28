import { mapAPIRuleToForm, type Rule } from "@dashboard/discounts/models";
import { sortRules } from "@dashboard/discounts/utils";
import {
  type PromotionDetailsFragment,
  type PromotionRuleCreateErrorFragment,
  type PromotionRuleUpdateErrorFragment,
} from "@dashboard/graphql";
import { type CommonError } from "@dashboard/utils/errors/common";
import { useEffect, useState } from "react";

import { getCurrentBrandCollectionIds, getCurrentConditionsValuesLabels } from "../utils";

interface UseRulesHandlersProps {
  data: PromotionDetailsFragment | undefined | null;
  ruleConditionsOptionsDetailsMap: Record<string, string>;
  /** Brand collection ids resolved from the selected options details query. */
  brandCollectionIds?: string[];
  giftsOptionsDetailsMap: Record<string, string>;
  onRuleUpdateSubmit: (data: Rule) => Promise<Array<CommonError<PromotionRuleUpdateErrorFragment>>>;
  onRuleCreateSubmit: (data: Rule) => Promise<Array<CommonError<PromotionRuleCreateErrorFragment>>>;
  onRuleDeleteSubmit: (id: string) => void;
}

export const useRulesHandlers = ({
  data,
  ruleConditionsOptionsDetailsMap,
  brandCollectionIds = [],
  giftsOptionsDetailsMap,
  onRuleUpdateSubmit,
  onRuleCreateSubmit,
  onRuleDeleteSubmit,
}: UseRulesHandlersProps) => {
  const [rulesErrors, setRulesErrors] = useState<Array<CommonError<any>>>([]);
  const [conditionValuesLabelMap, setConditionValuesLabelMap] = useState<Record<string, string>>(
    {},
  );
  // Brand ids picked in rules submitted during this session. The selected options details are
  // fetched only once per page load, so without these a freshly saved Brand condition would
  // load back as a Collections one.
  const [submittedBrandCollectionIds, setSubmittedBrandCollectionIds] = useState<string[]>([]);
  // Derived on every render (not stored), so rules are re-classified as soon as the details
  // query resolves; nothing is permanently misclassified while it is loading.
  const knownBrandCollectionIds = [...brandCollectionIds, ...submittedBrandCollectionIds];
  const rules = sortRules(
    data?.rules?.map(rule =>
      mapAPIRuleToForm(data?.type, rule, {
        conditionsValues: conditionValuesLabelMap,
        gifts: giftsOptionsDetailsMap,
        brandCollectionIds: knownBrandCollectionIds,
      }),
    ) ?? [],
  );

  useEffect(() => {
    setConditionValuesLabelMap(labels => {
      return {
        ...ruleConditionsOptionsDetailsMap,
        ...labels,
      };
    });
  }, [ruleConditionsOptionsDetailsMap]);

  const updateLabels = (rule: Rule) => {
    setConditionValuesLabelMap(labels => ({
      ...labels,
      ...getCurrentConditionsValuesLabels([rule]),
    }));
    setSubmittedBrandCollectionIds(ids => [...ids, ...getCurrentBrandCollectionIds([rule])]);
  };
  const onRuleSubmit = async (rule: Rule, ruleEditIndex: number | null) => {
    let errors: Array<
      CommonError<PromotionRuleUpdateErrorFragment | PromotionRuleCreateErrorFragment>
    > = [];

    updateLabels(rule);

    if (ruleEditIndex !== null) {
      errors = await onRuleUpdateSubmit(rule);

      if (errors.length > 0) {
        setRulesErrors(errors);
      }
    } else {
      errors = await onRuleCreateSubmit(rule);

      if (errors.length > 0) {
        setRulesErrors(errors);
      }
    }
  };
  const onDeleteRule = async (ruleDeleteIndex: number) => {
    if (ruleDeleteIndex === null) {
      return;
    }

    const ruleId = rules[ruleDeleteIndex].id;

    if (!ruleId) {
      return;
    }

    await onRuleDeleteSubmit(ruleId);
  };

  return {
    rulesErrors,
    rules,
    onDeleteRule,
    onRuleSubmit,
  };
};
