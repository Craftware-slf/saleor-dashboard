import { getStorefrontPreviewUrl } from "@dashboard/config";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { storage } from "@dashboard/legacy-sdk/core/storage";
import { type OutputData } from "@editorjs/editorjs";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { type FC, useCallback, useEffect, useRef, useState } from "react";

// How often live mode samples the form for changes while a preview tab is open.
const LIVE_PUSH_INTERVAL_MS = 1000;

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
  // Live mode starts only once the editor has opened a preview tab. Before that there is
  // nothing to keep in step, and pushing on every keystroke would be pure waste.
  const [live, setLive] = useState(false);
  // Addresses one payload for the whole session so updates replace it rather than piling
  // up. Generated here, not by the storefront: the storefront's cookie is SameSite=Lax and
  // the dashboard is a different origin, so a background fetch would never send it back.
  const previewId = useRef<string>(crypto.randomUUID());
  const lastPushed = useRef<string>("");
  // The getters are fresh closures on every render of the page, so depending on them
  // directly would restart the interval constantly. Mirror them into a ref instead, and
  // the live-push effect can depend only on things that are genuinely stable.
  const getters = useRef({ getName, getDescription, getSpecifications });

  getters.current = { getName, getDescription, getSpecifications };

  const collectFields = useCallback(
    async (token: string): Promise<Record<string, string>> => {
      const description = getters.current.getDescription();
      const specifications = await getters.current.getSpecifications();
      const fields: Record<string, string> = {
        token,
        slug,
        previewId: previewId.current,
        name: getters.current.getName(),
        path: `/products/${slug}`,
      };

      if (description) {
        fields.description = JSON.stringify(description);
      }

      if (specifications !== null) {
        fields.specifications = specifications;
      }

      return fields;
    },
    [slug],
  );

  // While a preview tab is open, poll our own form state and push only real changes.
  //
  // Polling rather than reacting to renders because the two values that matter most are
  // held in refs by the page (descriptionCache) and in editor instances (specifications) —
  // neither re-renders this component when it changes. A one-second tick doing a string
  // compare is cheaper than the alternatives and can't miss an edit.
  useEffect(
    function pushLivePreviewUpdates() {
      if (!live) {
        return;
      }

      const base = getStorefrontPreviewUrl().replace(/\/+$/, "");
      const timer = setInterval((): void => {
        void (async (): Promise<void> => {
          const token = storage.getAccessToken();

          if (!token) {
            return;
          }

          const fields = await collectFields(token);
          // Compare without the token, which rotates independently of the content.
          const { token: _token, ...content } = fields;
          const fingerprint = JSON.stringify(content);

          if (fingerprint === lastPushed.current) {
            return;
          }

          const body = new URLSearchParams({ ...fields, silent: "1" });

          try {
            // urlencoded + no custom headers keeps this a "simple" cross-origin request,
            // so it needs no preflight. Credentials are deliberately omitted: the payload
            // is addressed by previewId, not by the storefront's cookie.
            const res = await fetch(`${base}/api/preview`, { method: "POST", body });

            if (res.ok) {
              lastPushed.current = fingerprint;
            }
          } catch {
            // Storefront unreachable or CORS not configured — leave the preview tab on the
            // last good render rather than nagging the editor on every tick.
          }
        })();
      }, LIVE_PUSH_INTERVAL_MS);

      return (): void => {
        clearInterval(timer);
      };
    },
    [live, collectFields],
  );

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
      const fields = await collectFields(token);

      const { token: _token, ...content } = fields;

      lastPushed.current = JSON.stringify(content);

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
      // From here on, keep that tab in step as the editor keeps typing.
      setLive(true);
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
        {busy ? "Opening preview…" : live ? "Reopen preview tab" : "Preview on storefront"}
      </Button>
      <Text size={2} color="default2">
        {live
          ? "Live — the preview tab updates as you type. Price and stock are shown as last saved."
          : "Opens a new tab showing this product as customers would see it, including changes you have not saved. Price and stock are shown as last saved."}
      </Text>
    </Box>
  );
};

PreviewOnStorefrontButton.displayName = "PreviewOnStorefrontButton";
