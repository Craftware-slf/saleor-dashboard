import { DashboardModal } from "@dashboard/components/Modal";
import RichTextEditor from "@dashboard/components/RichTextEditor";
import { getSaleorAppBcUrl } from "@dashboard/config";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { storage } from "@dashboard/legacy-sdk/core/storage";
import useRichText from "@dashboard/utils/richText/useRichText";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import React from "react";

/**
 * FEAT-035 — "Fix formatting with AI" modal.
 *
 * Two modes (staff picks at open):
 *  - "Fix product specs":         normalise the spec into facts under short titles.
 *                                 The prose lifted out is shown read-only for the
 *                                 staff to copy into the description by hand — the
 *                                 description is never written in this mode.
 *  - "Fix product specs and description": Claude improves the spec AND the
 *                                 description together; both are shown in editable
 *                                 rich editors and saved together.
 *
 * The LLM only SUGGESTS (POST /api/reformat). Nothing is written until the staff
 * reviews/edits and clicks Save (POST /api/reformat/apply). Formatting only —
 * source language is preserved; Icelandic comes from the separate translate tool.
 */

type Mode = "specs" | "both";
type Phase = "choose" | "loading" | "edit" | "saving";

interface Suggestion {
  specifications: string;
  description?: string;
  removedProse?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  specifications: string | null;
  description: string | null;
  onDone: () => Promise<unknown>;
}

export const ReformatSpecsModal: React.FC<Props> = ({
  open,
  onClose,
  productId,
  specifications,
  description,
  onDone,
}) => {
  const notify = useNotifier();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [phase, setPhase] = React.useState<Phase>("choose");
  const [suggestion, setSuggestion] = React.useState<Suggestion | null>(null);

  const base = getSaleorAppBcUrl().replace(/\/+$/, "");
  const editing = phase === "edit";

  // Rich editors, pre-filled with the suggestions once they arrive.
  const specRT = useRichText({
    initial: suggestion?.specifications ?? null,
    loading: !editing,
    triggerChange: () => undefined,
  });
  const descRT = useRichText({
    initial: suggestion?.description ?? null,
    loading: !editing || mode !== "both",
    triggerChange: () => undefined,
  });

  const reset = React.useCallback(() => {
    setMode(null);
    setPhase("choose");
    setSuggestion(null);
  }, []);

  const close = () => {
    reset();
    onClose();
  };

  const authHeaders = (): Record<string, string> | null => {
    const token = storage.getAccessToken();

    if (!base) {
      notify({ status: "error", text: "SALEOR_APP_BC_URL is not configured." });

      return null;
    }

    if (!token) {
      notify({ status: "error", text: "Missing dashboard credentials." });

      return null;
    }

    return { "content-type": "application/json", Authorization: `Bearer ${token}` };
  };

  const runSuggest = async (m: Mode) => {
    if (!specifications || !specifications.trim()) {
      notify({
        status: "warning",
        text: "No specifications to reformat. Save the product first if you just typed them in.",
      });

      return;
    }

    const headers = authHeaders();

    if (!headers) {
      return;
    }

    setMode(m);
    setPhase("loading");

    try {
      const res = await fetch(`${base}/api/reformat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: m,
          specifications,
          ...(m === "both" ? { description: description ?? "" } : {}),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(body.error || `HTTP ${res.status}`);
      }

      setSuggestion((await res.json()) as Suggestion);
      setPhase("edit");
    } catch (e) {
      notify({
        status: "error",
        text: `Reformat failed: ${e instanceof Error ? e.message : String(e)}`,
      });
      setPhase("choose");
      setMode(null);
    }
  };

  const save = async () => {
    const headers = authHeaders();

    if (!headers) {
      return;
    }

    setPhase("saving");

    try {
      const specValue = JSON.stringify(await specRT.getValue());
      const descValue = mode === "both" ? JSON.stringify(await descRT.getValue()) : undefined;

      const res = await fetch(`${base}/api/reformat/apply`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId,
          specifications: specValue,
          ...(descValue !== undefined ? { description: descValue } : {}),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(body.error || `HTTP ${res.status}`);
      }

      notify({ status: "success", text: "Saved." });
      await onDone();
      close();
    } catch (e) {
      notify({
        status: "error",
        text: `Save failed: ${e instanceof Error ? e.message : String(e)}`,
      });
      setPhase("edit");
    }
  };

  return (
    <DashboardModal open={open} onChange={open ? close : undefined}>
      <DashboardModal.Content size="lg">
        <DashboardModal.Header>✨ Fix formatting with AI</DashboardModal.Header>

        {phase === "choose" && (
          <Box display="flex" flexDirection="column" gap={4} paddingY={4}>
            <Text color="default2">
              Claude will restructure the specifications. Nothing is saved until you review and
              confirm. Source language is kept — translation happens in the AI translations tool.
            </Text>
            <Box display="flex" flexDirection="column" gap={3}>
              <Button variant="primary" onClick={() => runSuggest("specs")}>
                Fix product specs
              </Button>
              <Text size={1} color="default2">
                Tidy the spec box only (facts under short titles). Marketing prose is shown for you
                to copy into the description — the description is not changed.
              </Text>
              <Button variant="secondary" onClick={() => runSuggest("both")}>
                Fix product specs and description
              </Button>
              <Text size={1} color="default2">
                Improve the spec and the description together — facts go to the spec box, marketing
                prose is merged into the description. Both are editable before saving.
              </Text>
            </Box>
          </Box>
        )}

        {phase === "loading" && (
          <Box paddingY={9} display="flex" justifyContent="center">
            <Text color="default2">Reformatting…</Text>
          </Box>
        )}

        {(phase === "edit" || phase === "saving") && suggestion && (
          <Box display="flex" flexDirection="column" gap={5} paddingY={2}>
            <Box>
              <Text size={3} fontWeight="bold" marginBottom={2} display="block">
                Specifications
              </Text>
              {specRT.isReadyForMount && (
                <RichTextEditor
                  editorRef={specRT.editorRef}
                  defaultValue={specRT.defaultValue}
                  onChange={specRT.handleChange}
                  disabled={phase === "saving"}
                  error={false}
                  label="Specifications"
                  name="reformat-specs"
                />
              )}
            </Box>

            {mode === "both" && (
              <Box>
                <Text size={3} fontWeight="bold" marginBottom={2} display="block">
                  Description
                </Text>
                {descRT.isReadyForMount && (
                  <RichTextEditor
                    editorRef={descRT.editorRef}
                    defaultValue={descRT.defaultValue}
                    onChange={descRT.handleChange}
                    disabled={phase === "saving"}
                    error={false}
                    label="Description"
                    name="reformat-description"
                  />
                )}
              </Box>
            )}

            {mode === "specs" && (
              <Box
                borderColor="default1"
                borderWidth={1}
                borderStyle="solid"
                borderRadius={3}
                padding={4}
                backgroundColor="default1"
              >
                <Text size={2} fontWeight="bold" display="block" marginBottom={1}>
                  Removed marketing text
                </Text>
                <Text size={1} color="default2" display="block" marginBottom={2}>
                  Not saved anywhere. Copy it into the product description yourself if you want to
                  keep it.
                </Text>
                <Text color="default2" __whiteSpace="pre-wrap">
                  {suggestion.removedProse?.trim() || "— none —"}
                </Text>
              </Box>
            )}
          </Box>
        )}

        <DashboardModal.Actions>
          {editing || phase === "saving" ? (
            <>
              <Button variant="tertiary" onClick={close} disabled={phase === "saving"}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save} disabled={phase === "saving"}>
                {phase === "saving" ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="tertiary" onClick={close} disabled={phase === "loading"}>
              Cancel
            </Button>
          )}
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
