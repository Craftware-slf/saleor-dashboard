// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import RichTextEditor from "@dashboard/components/RichTextEditor";
import { RichTextEditorLoading } from "@dashboard/components/RichTextEditor/RichTextEditorLoading";
import { type ProductErrorFragment } from "@dashboard/graphql";
import { commonMessages } from "@dashboard/intl";
import { getFormErrors, getProductErrorMessage } from "@dashboard/utils/errors";
import { useRichTextContext } from "@dashboard/utils/richText/context";
import { type OutputData } from "@editorjs/editorjs";
import { Box, Button, Input } from "@saleor/macaw-ui-next";
import { useState } from "react";
import { useIntl } from "react-intl";

interface ProductDetailsFormProps {
  data: {
    description: OutputData;
    name: string;
    rating: number;
  };
  disabled?: boolean;
  errors: ProductErrorFragment[];
  onDescriptionChange?: (data: OutputData) => void;
  onChange: (event: any) => any;
}

export const ProductDetailsForm = ({
  data,
  onChange,
  errors,
  disabled,
  onDescriptionChange,
}: ProductDetailsFormProps) => {
  const intl = useIntl();
  const formErrors = getFormErrors(["name", "description", "rating"], errors);
  const { editorRef, defaultValue, isReadyForMount, handleChange } = useRichTextContext();
  const [reformatting, setReformatting] = useState(false);

  // The Claude key lives server-side; the dashboard only POSTs the description
  // text to the backend and renders the structured result it returns.
  const reformatWithAI = async () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    setReformatting(true);

    try {
      const current = await editor.save();
      const res = await fetch("http://localhost:4002/api/reformat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: current }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(err.error || `reformat failed (${res.status})`);
      }

      const { description } = await res.json();

      await editor.render(description);

      if (onDescriptionChange) {
        onDescriptionChange(description);
      }

      handleChange();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Fix formatting with AI failed", e);
    } finally {
      setReformatting(false);
    }
  };

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage(commonMessages.generalInformations)}
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content display="grid" gap={2}>
        <Input
          label={intl.formatMessage({
            id: "6AMFki",
            defaultMessage: "Name",
            description: "product name",
          })}
          size="small"
          value={data.name || ""}
          onChange={onChange}
          error={!!formErrors.name}
          name="name"
          disabled={disabled}
          helperText={getProductErrorMessage(formErrors.name, intl)}
        />

        {/* Craftware: AI description formatting — fixes flat "word soup" descriptions. */}
        <Box display="flex" justifyContent="flex-end" marginTop={2}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            disabled={disabled || reformatting}
            onClick={reformatWithAI}
          >
            {reformatting ? "Reformatting…" : "✨ Fix formatting with AI"}
          </Button>
        </Box>

        {isReadyForMount ? (
          <RichTextEditor
            editorRef={editorRef}
            defaultValue={defaultValue}
            onChange={event => {
              // We need explicit handler so parent can access data real time
              if (onDescriptionChange) {
                onDescriptionChange(event);
              }

              handleChange();
            }}
            disabled={disabled}
            error={!!formErrors.description}
            helperText={getProductErrorMessage(formErrors.description, intl)}
            label={intl.formatMessage(commonMessages.description)}
            name="description"
          />
        ) : (
          <RichTextEditorLoading
            label={intl.formatMessage(commonMessages.description)}
            name="description"
          />
        )}
        <Box __width="25%">
          <Input
            label={intl.formatMessage({
              id: "L7N+0y",
              defaultMessage: "Product Rating",
              description: "product rating",
            })}
            size="small"
            value={data.rating || ""}
            onChange={onChange}
            error={!!formErrors.rating}
            name="rating"
            type="number"
            disabled={disabled}
            helperText={getProductErrorMessage(formErrors.rating, intl)}
          />
        </Box>
      </DashboardCard.Content>
    </DashboardCard>
  );
};
