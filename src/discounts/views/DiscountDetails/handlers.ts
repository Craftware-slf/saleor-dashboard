import { type FetchResult } from "@apollo/client";
import { type Rule, toAPI } from "@dashboard/discounts/models";
import {
  type PromotionDetailsFragment,
  type PromotionRuleCreateErrorFragment,
  type PromotionRuleCreateMutation,
  type PromotionRuleCreateMutationVariables,
  type PromotionRuleUpdateErrorFragment,
  type PromotionRuleUpdateMutation,
  type PromotionRuleUpdateMutationVariables,
  type PromotionUpdateMutation,
  type PromotionUpdateMutationVariables,
} from "@dashboard/graphql";
import { getMutationErrors, joinDateTime } from "@dashboard/misc";
import { type CommonError } from "@dashboard/utils/errors/common";
import difference from "lodash/difference";

import { CONDITIONAL_DISCOUNT_TYPE } from "../../conditional/form";
import { type DiscoutFormData } from "../../types";
import { storedConditionalValue } from "../conditionalSave";

export const createUpdateHandler = (
  promotion: PromotionDetailsFragment | undefined | null,
  update: (
    varaibles: PromotionUpdateMutationVariables,
  ) => Promise<FetchResult<PromotionUpdateMutation>>,
  /** Writes `orninn_conditional`; resolves to the number of errors. */
  writeConditionalMetadata?: (promotionId: string, value: string) => Promise<number>,
) => {
  return async (data: DiscoutFormData) => {
    if (!promotion) {
      return;
    }

    // Conditional discount: the rule's metadata first, so the promotionUpdate below fires
    // PROMOTION_UPDATED once the new rule is already stored (a bare updateMetadata fires
    // no promotion webhook). A read-only (unsupported) rule is left exactly as stored.
    if (
      data.type === CONDITIONAL_DISCOUNT_TYPE &&
      !data.conditional.unsupported &&
      writeConditionalMetadata
    ) {
      const value = storedConditionalValue(data.conditional);

      if (value === null || (await writeConditionalMetadata(promotion.id, value)) > 0) {
        return { errors: [], conditionalSaved: false };
      }
    }

    const updateResponse = await update({
      id: promotion.id,
      input: {
        name: data.name,
        description: data.description ? JSON.parse(data.description) : null,
        startDate: joinDateTime(data.dates.startDate, data.dates.startTime),
        endDate: data.dates.hasEndDate
          ? joinDateTime(data.dates.endDate, data.dates.endTime)
          : null,
      },
    });
    const errors = getMutationErrors(updateResponse);

    if (errors.length) {
      return { errors };
    }

    return { errors: [] };
  };
};

export const createRuleUpdateHandler = (
  promotionData: PromotionDetailsFragment | undefined | null,
  updateRule: (
    variables: PromotionRuleUpdateMutationVariables,
  ) => Promise<FetchResult<PromotionRuleUpdateMutation>>,
) => {
  return async (data: Rule) => {
    const emptyRuleErrors = [] as Array<CommonError<PromotionRuleUpdateErrorFragment>>;

    if (!promotionData) {
      return emptyRuleErrors;
    }

    const ruleData = promotionData?.rules?.find(rule => rule.id === data.id);
    const ruleChannels: string[] = ruleData?.channels?.map(channel => channel.id) ?? [];
    const ruleGifts: string[] = ruleData?.giftIds ?? [];
    const { channels, gifts, ...input } = toAPI(promotionData?.type)(data);
    const response = await updateRule({
      id: data.id!,
      input: {
        ...input,
        addChannels: difference(channels, ruleChannels),
        removeChannels: difference(ruleChannels, channels ?? []),
        addGifts: difference(gifts, ruleGifts),
        removeGifts: difference(ruleGifts, gifts ?? []),
      },
    });
    const errors = getMutationErrors(response);

    if (errors.length > 0) {
      return errors as Array<CommonError<PromotionRuleUpdateErrorFragment>>;
    }

    return emptyRuleErrors;
  };
};

export const createRuleCreateHandler = (
  promotionData: PromotionDetailsFragment | undefined | null,
  createRule: (
    variables: PromotionRuleCreateMutationVariables,
  ) => Promise<FetchResult<PromotionRuleCreateMutation>>,
) => {
  return async (data: Rule) => {
    const ruleData = toAPI(promotionData?.type)(data);
    const response = await createRule({
      input: {
        promotion: promotionData?.id ?? "",
        ...ruleData,
      },
    });
    const errors = getMutationErrors(response);

    if (errors.length > 0) {
      return errors as Array<CommonError<PromotionRuleCreateErrorFragment>>;
    }

    return [] as Array<CommonError<PromotionRuleCreateErrorFragment>>;
  };
};
