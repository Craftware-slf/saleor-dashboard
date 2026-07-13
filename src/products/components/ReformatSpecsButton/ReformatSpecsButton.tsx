import { Box, Button } from "@saleor/macaw-ui-next";
import React from "react";

import { ReformatSpecsModal } from "./ReformatSpecsModal";

interface ReformatSpecsButtonProps {
  productId: string;
  // Product name — passed to the model as context (helps it understand what the
  // product is when normalising the spec); never written back.
  name: string;
  // Current saved editor.js values.
  specifications: string | null;
  description: string | null;
  onDone: () => Promise<unknown>;
}

/**
 * FEAT-035: "Fix formatting with AI" launcher for the product `specifications`
 * attribute. Opens a modal where Claude suggests a normalised spec (and, in the
 * "and description" mode, an improved description); the staff reviews/edits in
 * rich editors and saves. The LLM only suggests — nothing is written until Save.
 */
export const ReformatSpecsButton: React.FC<ReformatSpecsButtonProps> = ({
  productId,
  name,
  specifications,
  description,
  onDone,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Box display="flex" justifyContent="flex-end" marginBottom={2}>
      <Button type="button" variant="secondary" size="small" onClick={() => setOpen(true)}>
        ✨ Fix formatting with AI
      </Button>
      <ReformatSpecsModal
        open={open}
        onClose={() => setOpen(false)}
        productId={productId}
        name={name}
        specifications={specifications}
        description={description}
        onDone={onDone}
      />
    </Box>
  );
};
