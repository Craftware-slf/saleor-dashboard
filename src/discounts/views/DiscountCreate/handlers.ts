import { type FetchResult } from "@apollo/client";
import { CONDITIONAL_DISCOUNT_TYPE } from "@dashboard/discounts/conditional/form";
import { toAPI } from "@dashboard/discounts/models";
import { type DiscoutFormData } from "@dashboard/discounts/types";
import {
  type PromotionCreateMutation,
  type PromotionCreateMutationVariables,
  PromotionTypeEnum,
} from "@dashboard/graphql";
import { getMutationErrors, joinDateTime } from "@dashboard/misc";

import { type ConditionalWriter, writeConditionalRule } from "../conditionalSave";

interface DiscountCreateResult {
  /** The new promotion, when it was created (even if writing its conditional rule failed). */
  promotionId?: string;
  errors: unknown[];
  /** False when a conditional rule could not be written to the created promotion. */
  conditionalSaved: boolean;
}

export const useDiscountCreate = (
  create: (
    varaibles: PromotionCreateMutationVariables,
  ) => Promise<FetchResult<PromotionCreateMutation>>,
  conditionalWriter: ConditionalWriter,
) => {
  return async (data: DiscoutFormData): Promise<DiscountCreateResult> => {
    const isConditional = data.type === CONDITIONAL_DISCOUNT_TYPE;
    const type = data.type === CONDITIONAL_DISCOUNT_TYPE ? PromotionTypeEnum.ORDER : data.type;
    const response = await create({
      input: {
        name: data.name,
        type,
        description: data.description ? JSON.parse(data.description) : null,
        endDate: data.dates.hasEndDate
          ? joinDateTime(data.dates.endDate, data.dates.endTime)
          : null,
        startDate: joinDateTime(data.dates.startDate, data.dates.startTime),
        // A conditional discount has no Saleor rules, so Saleor itself applies nothing.
        rules: isConditional ? [] : data.rules.map(toAPI(type)),
      },
    });
    const errors = getMutationErrors(response);
    const promotionId = response.data?.promotionCreate?.promotion?.id;

    if (errors.length > 0 || !promotionId) {
      return { errors, conditionalSaved: false };
    }

    if (!isConditional) {
      return { promotionId, errors: [], conditionalSaved: true };
    }

    const conditionalSaved = await writeConditionalRule(
      conditionalWriter,
      promotionId,
      data.name,
      data.conditional,
    );

    return { promotionId, errors: [], conditionalSaved };
  };
};
