import { getStorefrontPreviewUrl } from "@dashboard/config";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { storage } from "@dashboard/legacy-sdk/core/storage";
import { type OutputData } from "@editorjs/editorjs";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { type FC, useState } from "react";

// Craftware: preview a product on the storefront, including edits you HAVEN'T SAVED yet
// (FEAT-069). Saleor has no draft layer, so there is nothing on the server for the
// storefront to read — we ship the current form state over ourselves.
//
// Delivered as a synthetic form POST rather than a query string: a real description or
// spec sheet is far too big for a URL, and a POST keeps the draft out of browser history.

export interface PreviewOnStorefrontButtonProps {
  slug: string;
  /** Live form value, read at click time — NOT the saved product name. */
  getName: () => string;
  /**
   * Live description. Must come from the page's descriptionCache ref, never from
   * richText.getValue(): that clears isDirty, and the form only submits the description
   * when isDirty, so calling it here would make the editor's next Save silently drop
   * their description edits.
   */
  getDescription: () => OutputData | null;
  /** Live `specifications` rich-text attribute value, if the product has one. */
  getSpecifications: () => Promise<string | null>;
}

export const PreviewOnStorefrontButton: FC<PreviewOnStorefrontButtonProps> = ({
  slug,
  getName,
  getDescription,
  getSpecifications,
}) => {
  const notify = useNotifier();
  const [busy, setBusy] = useState(false);

  const onClick = async (): Promise<void> => {
    const base = getStorefrontPreviewUrl().replace(/\/+$/, "");

    if (!base) {
      notify({ status: "error", text: "Storefront preview URL is not configured." });

      return;
    }

    const token = storage.getAccessToken();

    if (!token) {
      notify({ status: "error", text: "Your session has expired — reload and try again." });

      return;
    }

    setBusy(true);

    try {
      const description = getDescription();
      const specifications = await getSpecifications();
      const fields: Record<string, string> = {
        token,
        slug,
        name: getName(),
        path: `/products/${slug}`,
      };

      if (description) {
        fields.description = JSON.stringify(description);
      }

      if (specifications !== null) {
        fields.specifications = specifications;
      }

      const form = document.createElement("form");

      form.method = "POST";
      form.action = `${base}/api/preview`;
      form.target = "_blank";
      form.style.display = "none";

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");

        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (e) {
      notify({
        status: "error",
        text: e instanceof Error ? e.message : "Could not open the storefront preview.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box marginTop={4} display="flex" flexDirection="column" gap={2}>
      <Button
        variant="secondary"
        onClick={onClick}
        disabled={busy}
        data-test-id="preview-on-storefront"
      >
        {busy ? "Opening preview…" : "Preview on storefront"}
      </Button>
      <Text size={2} color="default2">
        Opens a new tab showing this product as customers would see it, including changes you have
        not saved. Price and stock are shown as last saved.
      </Text>
    </Box>
  );
};

PreviewOnStorefrontButton.displayName = "PreviewOnStorefrontButton";
