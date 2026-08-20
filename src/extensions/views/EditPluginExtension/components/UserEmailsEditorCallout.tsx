// Craftware: signpost from the stock "User emails" plugin page to the Örninn
// customer-email editor (FEAT-091).
//
// Extensions → Installed → User emails is the dashboard's GENERIC plugin
// renderer: it walks the plugin's CONFIG_STRUCTURE and emits one widget per field
// type. For this plugin that is 38 fields per channel — 16 raw-HTML textareas, 11
// of them for events Örninn never sends, plus the SMTP host and password — and
// nothing anywhere saying when an email actually fires. Nobody edits a receipt in
// it, but it is the page a manager lands on, so it should point somewhere better.
//
// A link, not a replacement, for two reasons. Saleor offers no mount point that
// would let an app page render inside a plugin's settings page (the dashboard's
// own list has 51 mounts, none Configuration- or plugin-related). And the SMTP
// fields — sender name, sender address, host, port, TLS — live on this page and
// nowhere else, so hiding it would remove the only UI for them.

import { useOrninnEmailEditorUrl } from "@dashboard/extensions/hooks/useOrninnEmailEditorUrl";
import useNavigator from "@dashboard/hooks/useNavigator";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { type ReactElement } from "react";

/** Plugin this callout attaches to. */
export const USER_EMAIL_PLUGIN_ID = "mirumee.notifications.user_email";

export const UserEmailsEditorCallout = (): ReactElement | null => {
  const editorUrl = useOrninnEmailEditorUrl();
  const navigate = useNavigator();

  // Render nothing while the app list is loading or when the app is not
  // installed, so an environment without it degrades to no callout rather than a
  // dead button.
  if (!editorUrl) {
    return null;
  }

  return (
    <Box
      borderStyle="solid"
      borderWidth={1}
      borderColor="default1"
      borderRadius={4}
      padding={4}
      marginBottom={4}
      display="flex"
      flexDirection={{ mobile: "column", desktop: "row" }}
      gap={4}
      justifyContent="space-between"
      alignItems={{ mobile: "flex-start", desktop: "center" }}
      data-test-id="user-emails-editor-callout"
    >
      <Box display="flex" flexDirection="column" gap={1}>
        <Text size={4} fontWeight="bold">
          Customer email editor
        </Text>
        <Text size={3} color="default2">
          The fields below hold raw HTML for all sixteen Saleor templates, including the eleven
          Örninn never sends. The editor shows only the five emails a customer receives, says when
          each one fires, and previews them against sample data. Sender settings stay on this page.
        </Text>
      </Box>
      <Button
        variant="primary"
        onClick={() => navigate(editorUrl)}
        data-test-id="open-user-emails-editor"
      >
        Open the editor
      </Button>
    </Box>
  );
};
