import BackButton from "@dashboard/components/BackButton";
import {
  ConfirmButton,
  type ConfirmButtonTransitionState,
} from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { formatMoney } from "@dashboard/components/Money";
import { type Rule } from "@dashboard/discounts/models";
import useLocale from "@dashboard/hooks/useLocale";
import { buttonMessages } from "@dashboard/intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Text } from "@saleor/macaw-ui-next";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useIntl } from "react-intl";

import { useDiscountRulesContext } from "../../context";
import { messages } from "../../messages";
import { getDefaultValue } from "./defaultFormValues";
import { useFixedAmountGuard } from "./fixedAmountGuard";
import { getValidationSchema } from "./validationSchema";

interface RuleFormModalProps {
  children: ReactNode;
  onClose: () => void;
  onSubmit: (data: Rule) => void | Promise<void>;
  confimButtonState: ConfirmButtonTransitionState;
  initialFormValues?: Rule | null;
}

export const RuleFormModal = ({
  onClose,
  initialFormValues,
  confimButtonState,
  children,
  onSubmit,
}: RuleFormModalProps): JSX.Element => {
  const intl = useIntl();
  const { discountType, channels } = useDiscountRulesContext();
  const { locale } = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const methods = useForm<Rule>({
    mode: "onBlur",
    values: initialFormValues || getDefaultValue(discountType),
    resolver: zodResolver(getValidationSchema(intl)),
  });
  // Örninn FEAT-251: refuse a fixed amount that would take a product's whole price.
  const checkFixedAmount = useFixedAmountGuard(channels);
  // The price lookup runs before the save starts, so a second click in that window must not save
  // the rule twice.
  const submitting = useRef(false);
  const submit = useCallback(
    async (data: Rule): Promise<void> => {
      if (submitting.current) {
        return;
      }

      submitting.current = true;

      try {
        const wiped = await checkFixedAmount(data);
        const first = wiped[0];

        if (first) {
          methods.setError("rewardValue", {
            type: "manual",
            message: intl.formatMessage(messages.fixedAmountTooHigh, {
              amount: formatMoney(
                { amount: data.rewardValue ?? 0, currency: first.currency },
                locale,
              ),
              name: first.name,
              price: formatMoney({ amount: first.amount, currency: first.currency }, locale),
              more: wiped.length - 1,
            }),
          });

          return;
        }

        await onSubmit(data);
      } finally {
        submitting.current = false;
      }
    },
    [checkFixedAmount, intl, locale, methods, onSubmit],
  );
  const updateOverflowState = useCallback((): void => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    setHasOverflow(scrollContainer.scrollHeight > scrollContainer.clientHeight + 1);
  }, []);

  useEffect(() => {
    updateOverflowState();

    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    window.addEventListener("resize", updateOverflowState);

    if (typeof ResizeObserver === "undefined") {
      return (): void => {
        window.removeEventListener("resize", updateOverflowState);
      };
    }

    const resizeObserver = new ResizeObserver((): void => {
      updateOverflowState();
    });

    resizeObserver.observe(scrollContainer);

    return (): void => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [updateOverflowState]);

  return (
    <DashboardModal open={true} onChange={onClose}>
      <DashboardModal.Content
        size="md"
        display="flex"
        flexDirection="column"
        overflowY="hidden"
        backgroundColor="default1"
        data-test-id="add-rule-dialog"
      >
        <Box display="flex" flexDirection="column" gap={2} flexShrink="0">
          <DashboardModal.Header>
            {intl.formatMessage(initialFormValues ? messages.editRule : messages.addRule)}
          </DashboardModal.Header>
          <Text size={2} color="default2">
            {intl.formatMessage(messages.ruleModalSubtitle)}
          </Text>
        </Box>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(submit)}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1 1 auto",
              minHeight: 0,
            }}
          >
            <Box
              ref={scrollContainerRef}
              display="flex"
              flexDirection="column"
              gap={5}
              overflowY="auto"
              __flex="1 1 auto"
              __minHeight="0"
              __paddingRight={hasOverflow ? "var(--mu-spacing-2)" : undefined}
              __marginRight={hasOverflow ? "calc(-1 * var(--mu-spacing-2))" : undefined}
              paddingBottom={1}
            >
              {children}
            </Box>
            <Box flexShrink="0" display="flex" flexDirection="column" gap={5} paddingTop={5}>
              <Box
                __height="1px"
                __backgroundColor="var(--mu-colors-border-default1)"
                __marginLeft="calc(-1 * var(--mu-spacing-6))"
                __marginRight="calc(-1 * var(--mu-spacing-6))"
              />
              <DashboardModal.Actions>
                <BackButton onClick={onClose} />
                <ConfirmButton
                  data-test-id="saveRuleButton"
                  transitionState={confimButtonState}
                  onClick={methods.handleSubmit(submit)}
                >
                  {intl.formatMessage(buttonMessages.save)}
                </ConfirmButton>
              </DashboardModal.Actions>
            </Box>
          </form>
        </FormProvider>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
