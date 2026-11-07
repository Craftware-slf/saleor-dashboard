import useAppChannel from "@dashboard/components/AppLayout/AppChannelContext";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { DiscountCreatePage } from "@dashboard/discounts/components/DiscountCreatePage";
import { conditionalMessages } from "@dashboard/discounts/conditional/messages";
import { discountListUrl, discountUrl } from "@dashboard/discounts/discountsUrls";
import { type DiscoutFormData } from "@dashboard/discounts/types";
import {
  usePromotionCreateMutation,
  usePromotionUpdateMutation,
  useUpdateMetadataMutation,
} from "@dashboard/graphql";
import useNavigator from "@dashboard/hooks/useNavigator";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { commonMessages } from "@dashboard/intl";
import { getMutationErrors } from "@dashboard/misc";
import { useIntl } from "react-intl";

import { makeConditionalWriter } from "../conditionalSave";
import { EmpptyLabelsMapsProvider } from "../DiscountDetails/context/provider";
import { useDiscountCreate } from "./handlers";

export const DiscountCreate = () => {
  const { availableChannels } = useAppChannel(false);
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();
  const [promotionCreate, promotionCreateOpts] = usePromotionCreateMutation({});
  const [updateMetadata, updateMetadataOpts] = useUpdateMetadataMutation({});
  const [promotionUpdate, promotionUpdateOpts] = usePromotionUpdateMutation({});
  const conditionalWriter = makeConditionalWriter(
    async (id, input) => {
      const result = await updateMetadata({ variables: { id, input, keysToDelete: [] } });

      return { errors: result.data?.updateMetadata?.errors.length ?? 1 };
    },
    async (id, name) => {
      const result = await promotionUpdate({ variables: { id, input: { name } } });

      return { errors: result.data?.promotionUpdate?.errors.length ?? 1 };
    },
  );
  const createPromotion = useDiscountCreate(
    variables => promotionCreate({ variables }),
    conditionalWriter,
  );
  // Navigation waits for the conditional rule's metadata, so the details page never loads
  // a half-saved conditional discount.
  const handlePromotionCreate = async (data: DiscoutFormData): Promise<void> => {
    const result = await createPromotion(data);

    if (!result.promotionId) {
      return;
    }

    if (result.conditionalSaved) {
      notify({
        status: "success",
        text: intl.formatMessage({
          id: "qC6HKe",
          defaultMessage: "Discount created",
        }),
      });
    } else {
      notify({ status: "error", text: intl.formatMessage(conditionalMessages.saveFailed) });
    }

    navigate(discountUrl(result.promotionId), { replace: true });
  };
  const saving =
    promotionCreateOpts.loading || updateMetadataOpts.loading || promotionUpdateOpts.loading;

  return (
    <>
      <WindowTitle title={intl.formatMessage(commonMessages.discounts)} />
      <EmpptyLabelsMapsProvider>
        <DiscountCreatePage
          disabled={saving}
          onBack={() => {
            navigate(discountListUrl());
          }}
          errors={getMutationErrors(promotionCreateOpts)}
          channels={availableChannels}
          submitButtonState={saving ? "loading" : promotionCreateOpts.status}
          onSubmit={handlePromotionCreate}
        />
      </EmpptyLabelsMapsProvider>
    </>
  );
};
