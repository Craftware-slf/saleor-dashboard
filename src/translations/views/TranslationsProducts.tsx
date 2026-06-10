// @ts-strict-ignore
import {
  type LanguageCodeEnum,
  useProductTranslationDetailsQuery,
  useUpdateAttributeValueTranslationsMutation,
  useUpdateProductTranslationsMutation,
} from "@dashboard/graphql";
import useNavigator from "@dashboard/hooks/useNavigator";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import useShop from "@dashboard/hooks/useShop";
import { getMultipleUrlValues, stringifyQs } from "@dashboard/utils/urls";
import { type OutputData } from "@editorjs/editorjs";
import { useState } from "react";
import { useIntl } from "react-intl";

import { extractMutationErrors, maybe } from "../../misc";
import { TranslationsProductsPage } from "../components/TranslationsProductsPage";
import { type TranslationField, type TranslationInputFieldName } from "../types";
import { getAttributeValueTranslationsInputData, getParsedTranslationInputData } from "../utils";

type HandleSubmitAttributeValue = OutputData | string;

export interface TranslationsProductsQueryParams {
  activeField: string;
}
interface TranslationsProductsProps {
  id: string;
  languageCode: LanguageCodeEnum;
  params: TranslationsProductsQueryParams;
}

const TranslationsProducts = ({ id, languageCode, params }: TranslationsProductsProps) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const shop = useShop();
  const intl = useIntl();
  const productTranslations = useProductTranslationDetailsQuery({
    variables: { id, language: languageCode },
  });
  const onUpdate = (errors: unknown[]) => {
    if (errors.length === 0) {
      productTranslations.refetch();
      notify({
        status: "success",
        text: intl.formatMessage({ id: "WLyKAQ", defaultMessage: "Translation saved" }),
      });
    }
  };
  const [updateTranslations, updateTranslationsOpts] = useUpdateProductTranslationsMutation({
    onCompleted: data => onUpdate(data.productTranslate.errors),
  });
  const [updateAttributeValueTranslations] = useUpdateAttributeValueTranslationsMutation({
    onCompleted: data => onUpdate(data.attributeValueTranslate.errors),
  });
  const onEdit = (field: string | string[]) =>
    navigate(
      "?" +
        stringifyQs(
          {
            activeField: field,
          },
          "repeat",
        ),
      { replace: true },
    );
  const onDiscard = (field?: string) => {
    if (!field) {
      return navigate("?", { replace: true });
    }

    const activeFields = getMultipleUrlValues(new URL(window.location.href).search, "activeField");

    navigate(
      "?" +
        stringifyQs(
          {
            activeField: activeFields.filter(f => f !== field),
          },
          "repeat",
        ),
      { replace: true },
    );
  };

  const handleSubmit = (
    { name: fieldName }: TranslationField<TranslationInputFieldName>,
    data: string,
  ) => {
    return extractMutationErrors(
      updateTranslations({
        variables: {
          id,
          input: getParsedTranslationInputData({
            data,
            fieldName,
          }),
          language: languageCode,
        },
      }),
    ).then(errors => {
      if (errors.length === 0) {
        const activeFields = getMultipleUrlValues(
          new URL(window.location.href).search,
          "activeField",
        );

        const newActiveFields = activeFields.filter(f => f !== fieldName);

        navigate(
          "?" +
            stringifyQs(
              {
                activeField: newActiveFields,
              },
              "repeat",
            ),
          { replace: true },
        );
      }

      return errors;
    });
  };
  const handleAttributeValueSubmit = (
    { id, type }: TranslationField<TranslationInputFieldName>,
    data: HandleSubmitAttributeValue,
  ) =>
    extractMutationErrors(
      updateAttributeValueTranslations({
        variables: {
          id,
          input: getAttributeValueTranslationsInputData(type, data),
          language: languageCode,
        },
      }),
    );
  const translation = productTranslations?.data?.translation;

  // Craftware: translate EVERY field into the selected language in one go and
  // generate the SEO title/description, via the Claude backend (key server-side).
  // Then write it all with a single productTranslate mutation.
  const [translatingAll, setTranslatingAll] = useState(false);
  const handleTranslateAll = async () => {
    const base = translation?.__typename === "ProductTranslatableContent" ? translation.product : null;

    if (!base) {
      return;
    }

    const languageName =
      maybe(() => shop.languages, []).find(l => l.code === languageCode)?.language ?? languageCode;

    setTranslatingAll(true);

    try {
      const res = await fetch("http://localhost:4002/api/translate-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: base.name,
          description: base.description,
          languageName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err.error || `translate-all failed (${res.status})`);
      }

      const fields = await res.json();

      await updateTranslations({
        variables: {
          id,
          input: {
            name: fields.name,
            description: fields.description,
            seoTitle: fields.seoTitle,
            seoDescription: fields.seoDescription,
          },
          language: languageCode,
        },
      });
    } catch (e) {
      notify({ status: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setTranslatingAll(false);
    }
  };

  return (
    <TranslationsProductsPage
      translationId={id}
      productId={id}
      activeField={params.activeField}
      disabled={productTranslations.loading || updateTranslationsOpts.loading}
      languageCode={languageCode}
      languages={maybe(() => shop.languages, [])}
      saveButtonState={updateTranslationsOpts.status}
      onEdit={onEdit}
      onDiscard={onDiscard}
      onSubmit={handleSubmit}
      onAttributeValueSubmit={handleAttributeValueSubmit}
      onTranslateAll={handleTranslateAll}
      translateAllLoading={translatingAll}
      data={translation?.__typename === "ProductTranslatableContent" ? translation : null}
    />
  );
};

TranslationsProducts.displayName = "TranslationsProducts";
export default TranslationsProducts;
