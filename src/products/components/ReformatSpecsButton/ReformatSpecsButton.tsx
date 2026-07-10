import { getSaleorAppBcUrl } from "@dashboard/config";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { storage } from "@dashboard/legacy-sdk/core/storage";
import { Box, Button } from "@saleor/macaw-ui-next";
import React from "react";

interface ReformatSpecsButtonProps {
  productId: string;
  // Current saved editor.js value of the product's `specifications` attribute.
  specifications: string | null;
  onDone: () => Promise<unknown>;
}

/**
 * FEAT-035: "Fix formatting with AI" for the product `specifications` attribute.
 *
 * POSTs the current spec value to saleor-app-bc `/api/reformat`, which asks Claude
 * to restructure the supplier blob into section titles + rows and writes it back
 * to the `specifications` attribute value (as the current staff user, via the
 * forwarded token). Formatting only — Icelandic comes from the separate
 * "translate all" tool. On success we refetch so the specs editor shows the
 * cleaned value.
 *
 * Replaces the old description-targeted button that POSTed to a hardcoded
 * localhost:4002 backend that was never shipped.
 */
export const ReformatSpecsButton: React.FC<ReformatSpecsButtonProps> = ({
  productId,
  specifications,
  onDone,
}) => {
  const notify = useNotifier();
  const [loading, setLoading] = React.useState(false);

  const run = async () => {
    const token = storage.getAccessToken();
    const base = getSaleorAppBcUrl().replace(/\/+$/, "");

    if (!base) {
      notify({ status: "error", text: "SALEOR_APP_BC_URL er ekki stillt." });

      return;
    }

    if (!token) {
      notify({ status: "error", text: "Vantar auðkenni." });

      return;
    }

    if (!specifications || !specifications.trim()) {
      notify({
        status: "warning",
        text: "Engar tæknilýsingar til að laga. Vistaðu fyrst ef þú ert nýbúinn að slá inn.",
      });

      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${base}/api/reformat`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, specifications }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(body.error || `HTTP ${res.status}`);
      }

      notify({ status: "success", text: "Tæknilýsingar lagaðar." });
      await onDone();
    } catch (e) {
      notify({
        status: "error",
        text: `Mistókst að laga: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="flex-end" marginBottom={2}>
      <Button type="button" variant="secondary" size="small" disabled={loading} onClick={run}>
        {loading ? "Reformatting…" : "✨ Fix formatting with AI"}
      </Button>
    </Box>
  );
};
