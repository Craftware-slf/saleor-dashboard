import {
  CONDITIONAL_DISCOUNT_TYPE,
  type ConditionalErrorCode,
  type ConditionalFormValues,
  validateConditionalForm,
} from "@dashboard/discounts/conditional/form";
import { conditionalMessages } from "@dashboard/discounts/conditional/messages";
import { PromotionTypeEnum } from "@dashboard/graphql";
import { defineMessages, type IntlShape, type MessageDescriptor } from "react-intl";
import * as z from "zod";

const validationMessages = defineMessages({
  nameRequired: {
    id: "7Hdiw2",
    defaultMessage: "Rule name is required",
  },
});

const conditionalErrorMessages: Record<ConditionalErrorCode, MessageDescriptor> = {
  required: conditionalMessages.errorChannels,
  noItems: conditionalMessages.errorItems,
  positiveInt: conditionalMessages.errorPositiveInt,
  tiers: conditionalMessages.errorTiers,
  percentage: conditionalMessages.errorPercentage,
  fixed: conditionalMessages.errorFixed,
  freeNeedsBuyGet: conditionalMessages.errorFree,
};

export const getValidationSchema = (intl: IntlShape) => {
  return z
    .object({
      type: z.enum([
        PromotionTypeEnum.CATALOGUE,
        PromotionTypeEnum.ORDER,
        CONDITIONAL_DISCOUNT_TYPE,
      ]),
      name: z.string().min(1, intl.formatMessage(validationMessages.nameRequired)),
      description: z.string().optional(),
      dates: z
        .object({
          endDate: z.string().optional(),
          endTime: z.string().optional(),
          hasEndDate: z.boolean().optional(),
          startDate: z.string().optional(),
          startTime: z.string().optional(),
        })
        .refine(
          data => {
            if (data.hasEndDate && data.endDate && !data.startDate) {
              return false;
            }

            return true;
          },
          {
            message: "Start date is required when end date is provided",
            path: ["startDate"],
          },
        ),
      rules: z.array(z.any()).optional(),
      conditional: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type !== CONDITIONAL_DISCOUNT_TYPE || !data.conditional) {
        return;
      }

      const errors = validateConditionalForm(data.conditional as ConditionalFormValues);

      for (const [field, code] of Object.entries(errors)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["conditional", field],
          message: intl.formatMessage(conditionalErrorMessages[code]),
        });
      }
    });
};
