import { DashboardModal } from "@dashboard/components/Modal";
import { Box } from "@saleor/macaw-ui-next";
import { type PropsWithChildren } from "react";

interface AppDialogProps {
  title?: string;
  onClose: () => void;
  open: boolean;
}

// Craftware: an extension cannot resize its own iframe, and the multi-step app
// pages served by saleor-app-bc (Bulk edit, Bundle, Size chart, …) need more
// than the stock 1280×600 box. The dialog takes the viewport minus a 16px
// gutter on every side; the title bar keeps its natural height and the iframe
// box is the remaining grid row. `100%` rather than `100vw`/`100vh`: the
// content box is `position: fixed`, so both resolve against the viewport, but
// `100%` excludes a scrollbar and tracks mobile Safari's visible area.
const VIEWPORT_MINUS_GUTTER = "calc(100% - 32px)";

export const AppDialog = ({
  children,
  title,
  onClose,
  ...props
}: PropsWithChildren<AppDialogProps>) => {
  return (
    <DashboardModal aria-labelledby="extension app dialog" {...props} onChange={onClose}>
      <DashboardModal.Content
        size="xl"
        __width={VIEWPORT_MINUS_GUTTER}
        __maxWidth="none"
        __height={VIEWPORT_MINUS_GUTTER}
        __maxHeight={VIEWPORT_MINUS_GUTTER}
        __gridTemplateRows="auto minmax(0, 1fr)"
        data-test-id="app-dialog-content"
      >
        <DashboardModal.Header as="h2">{title}</DashboardModal.Header>
        <Box width="100%" height="100%" data-test-id="app-dialog-frame">
          {children}
        </Box>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
