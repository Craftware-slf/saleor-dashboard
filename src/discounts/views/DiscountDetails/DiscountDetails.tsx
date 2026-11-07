import useAppChannel from "@dashboard/components/AppLayout/AppChannelContext";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { DiscountDeleteModal } from "@dashboard/discounts/components/DiscountDeleteModal";
import { DiscountDetailsPage } from "@dashboard/discounts/components/DiscountDetailsPage";
import { CONDITIONAL_RULE_KEY } from "@dashboard/discounts/conditional/conditionalRule";
import { conditionalMessages } from "@dashboard/discounts/conditional/messages";
import {
  discountSalesListPath,
  type DiscountUrlQueryParams,
} from "@dashboard/discounts/discountsUrls";
import { type DiscoutFormData } from "@dashboard/discounts/types";
import { useUpdateMetadataMutation } from "@dashboard/graphql";
import { useBackLinkWithState } from "@dashboard/hooks/useBackLinkWithState";
import useNavigator from "@dashboard/hooks/useNavigator";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { commonMessages } from "@dashboard/intl";
import { getMutationErrors } from "@dashboard/misc";
import { useState } from "react";
import { useIntl } from "react-intl";

import { LabelsMapsProvider } from "./context/provider";
import { createRuleCreateHandler, createRuleUpdateHandler, createUpdateHandler } from "./handlers";
import { usePromotionData } from "./hooks/usePromotionData";
import { usePromotionDelete } from "./hooks/usePromotionDelete";
import { usePromotionRuleCreate } from "./hooks/usePromotionRuleCreate";
import { usePromotionRuleDelete } from "./hooks/usePromotionRuleDelete";
import { usePromotionRuleUpdate } from "./hooks/usePromotionRuleUpdate";
import { usePromotionUpdate } from "./hooks/usePromotionUpdate";

interface DiscountDetailsProps {
  id: string;
  params: DiscountUrlQueryParams;
}

export const DiscountDetails = ({ id }: DiscountDetailsProps) => {
  const { availableChannels } = useAppChannel(false);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();
  const { promotionData, loading } = usePromotionData(id);
  const { promotionUpdate, promotionUpdateOpts } = usePromotionUpdate(id);
  const { promotionDelete, promotionDeleteOpts } = usePromotionDelete();
  const { promotionRuleUpdate, promotionRuleUpdateOpts } = usePromotionRuleUpdate(id);
  const { promotionRuleCreate, promotionRuleCreateOpts } = usePromotionRuleCreate(id);
  const { promotionRuleDelete, promotionRuleDeleteOpts } = usePromotionRuleDelete(id);
  const discountListBackLink = useBackLinkWithState({
    path: discountSalesListPath,
  });
  const [updateMetadata, updateMetadataOpts] = useUpdateMetadataMutation({});
  const submitUpdate = createUpdateHandler(
    promotionData?.promotion,
    variables => promotionUpdate({ variables }),
    async (promotionId, value) => {
      const result = await updateMetadata({
        variables: {
          id: promotionId,
          input: [{ key: CONDITIONAL_RULE_KEY, value }],
          keysToDelete: [],
        },
      });

      return result.data?.updateMetadata?.errors.length ?? 1;
    },
  );
  const onSubmit = async (data: DiscoutFormData): Promise<void> => {
    const result = await submitUpdate(data);

    if (result && "conditionalSaved" in result && !result.conditionalSaved) {
      notify({ status: "error", text: intl.formatMessage(conditionalMessages.saveFailed) });
    }
  };
  const onRuleUpdateSubmit = createRuleUpdateHandler(promotionData?.promotion, variables =>
    promotionRuleUpdate({ variables }),
  );
  const onRuleCreateSubmit = createRuleCreateHandler(promotionData?.promotion, variables =>
    promotionRuleCreate({ variables }),
  );
  const onRuleDeleteSubmit = (id: string) => {
    return promotionRuleDelete({
      variables: {
        id,
      },
    });
  };
  const onPromotionDelete = () => {
    promotionDelete({
      variables: {
        id,
      },
    });
  };

  return (
    <>
      <WindowTitle title={intl.formatMessage(commonMessages.discounts)} />
      <LabelsMapsProvider promotionData={promotionData}>
        <DiscountDetailsPage
          data={promotionData?.promotion}
          errors={getMutationErrors(promotionUpdateOpts)}
          disabled={
            loading ||
            updateMetadataOpts.loading ||
            promotionUpdateOpts.loading ||
            promotionDeleteOpts.loading ||
            promotionRuleUpdateOpts.loading ||
            promotionRuleCreateOpts.loading ||
            promotionRuleDeleteOpts.loading
          }
          onBack={() => {
            navigate(discountListBackLink);
          }}
          channels={availableChannels}
          onSubmit={onSubmit}
          onDelete={() => setOpenModal(true)}
          submitButtonState={promotionUpdateOpts.status}
          onRuleUpdateSubmit={onRuleUpdateSubmit}
          ruleUpdateButtonState={promotionRuleUpdateOpts.status}
          onRuleCreateSubmit={onRuleCreateSubmit}
          ruleCreateButtonState={promotionRuleCreateOpts.status}
          onRuleDeleteSubmit={onRuleDeleteSubmit}
          ruleDeleteButtonState={promotionRuleDeleteOpts.status}
          backLinkHref={discountListBackLink}
        />
      </LabelsMapsProvider>
      <DiscountDeleteModal
        confirmButtonTransitionState={promotionDeleteOpts.status}
        onChange={() => setOpenModal(false)}
        onConfirm={onPromotionDelete}
        open={openModal}
      />
    </>
  );
};
