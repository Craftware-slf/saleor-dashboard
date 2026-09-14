import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetadataDialog, type MetadataDialogProps } from "./MetadataDialog";

const defaultProps: MetadataDialogProps = {
  open: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  data: {
    metadata: [],
    privateMetadata: [],
  },
  onChange: jest.fn(),
  loading: false,
  disabled: false,
  formIsDirty: false,
};

describe("MetadataDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("close behavior without unsaved changes", () => {
    it("closes immediately when formIsDirty is false", async () => {
      // Arrange
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onClose={onClose} formIsDirty={false} />);

      // Act
      await user.click(screen.getByTestId("back"));

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not show ExitFormDialog when closing with clean form", async () => {
      // Arrange
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onClose={onClose} formIsDirty={false} />);

      // Act
      await user.click(screen.getByTestId("back"));

      // Assert
      expect(screen.queryByText("You have unsaved changes")).not.toBeInTheDocument();
      expect(screen.queryByTestId("ignore-changes")).not.toBeInTheDocument();
    });
  });

  describe("close behavior with unsaved changes", () => {
    it("shows ExitFormDialog when trying to close with formIsDirty set to true", async () => {
      // Arrange
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onClose={onClose} formIsDirty={true} />);

      // Act
      await user.click(screen.getByTestId("back"));

      // Assert - ExitFormDialog should be visible
      expect(screen.getByTestId("ignore-changes")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("keeps dialog open when 'Keep editing' is clicked in ExitFormDialog", async () => {
      // Arrange
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onClose={onClose} formIsDirty={true} />);

      // Act - open exit dialog
      await user.click(screen.getByTestId("back"));

      // Assert - exit dialog is visible
      expect(screen.getByTestId("ignore-changes")).toBeInTheDocument();

      // Act - click "Keep editing" (back button in ExitFormDialog)
      const exitDialog = screen
        .getByTestId("ignore-changes")
        .closest("[role='dialog']") as HTMLElement;
      const keepEditingButton = within(exitDialog).getAllByTestId("back")[0];

      await user.click(keepEditingButton);

      // Assert - exit dialog is closed, main dialog stays open, onClose not called
      expect(screen.queryByTestId("ignore-changes")).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId("save")).toBeInTheDocument();
    });

    it("closes dialog when 'Ignore changes' is clicked in ExitFormDialog", async () => {
      // Arrange
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onClose={onClose} formIsDirty={true} />);

      // Act - open exit dialog
      await user.click(screen.getByTestId("back"));

      // Act - click "Ignore changes"
      await user.click(screen.getByTestId("ignore-changes"));

      // Assert - onClose should be called
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when ExitFormDialog is shown", async () => {
      // Arrange
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onClose={onClose} formIsDirty={true} />);

      // Act
      await user.click(screen.getByTestId("back"));

      // Assert
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("save button behavior", () => {
    it("disables save button when formIsDirty is false", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} formIsDirty={false} />);

      // Assert
      expect(screen.getByTestId("save")).toBeDisabled();
    });

    it("enables save button when formIsDirty is true", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} formIsDirty={true} />);

      // Assert
      expect(screen.getByTestId("save")).not.toBeDisabled();
    });

    it("calls onSave when save button is clicked", async () => {
      // Arrange
      const onSave = jest.fn();
      const user = userEvent.setup();

      render(<MetadataDialog {...defaultProps} onSave={onSave} formIsDirty={true} />);

      // Act
      await user.click(screen.getByTestId("save"));

      // Assert
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("disables save button when loading is true", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} formIsDirty={true} loading={true} />);

      // Assert
      expect(screen.getByTestId("save")).toBeDisabled();
    });

    it("disables save button when disabled is true", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} formIsDirty={true} disabled={true} />);

      // Assert
      expect(screen.getByTestId("save")).toBeDisabled();
    });
  });

  describe("dialog rendering", () => {
    it("renders with default title 'Metadata' when no title prop is provided", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} />);

      // Assert
      // The title "Metadata" appears both in header and MetadataCard components
      // Check that the dialog is rendered with any "Metadata" text
      const metadataTexts = screen.getAllByText("Metadata");

      expect(metadataTexts.length).toBeGreaterThanOrEqual(1);
    });

    it("renders with custom title when title prop is provided", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} title="Custom Title" />);

      // Assert
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      // Arrange & Act
      render(<MetadataDialog {...defaultProps} open={false} />);

      // Assert
      expect(screen.queryByTestId("save")).not.toBeInTheDocument();
      expect(screen.queryByTestId("back")).not.toBeInTheDocument();
    });
  });

  describe("readonlyPrivateMetadata", () => {
    const withData: MetadataDialogProps = {
      ...defaultProps,
      data: {
        metadata: [{ key: "order_note", value: "leave at the door" }],
        privateMetadata: [{ key: "kennitala", value: "0101902079" }],
      },
    };

    // The two cards render in order: [0] public, [1] private.
    const expandBoth = async (user: ReturnType<typeof userEvent.setup>) => {
      const [expandPublic, expandPrivate] = screen.getAllByTestId("expand");

      await user.click(expandPublic);
      await user.click(expandPrivate);
    };

    const cards = () => screen.getAllByTestId("metadata-editor");

    it("drops every edit affordance from the private card when set", async () => {
      // Arrange
      const user = userEvent.setup();

      render(<MetadataDialog {...withData} readonlyPrivateMetadata />);

      // Act
      await expandBoth(user);

      // Assert — the value is still readable...
      const [, privateCard] = cards();

      expect(within(privateCard).getByDisplayValue("kennitala")).toBeInTheDocument();
      expect(within(privateCard).getByDisplayValue("0101902079")).toBeInTheDocument();

      // ...but nothing can be typed into it. Note `readonly` keeps the textarea and
      // marks it readOnly rather than swapping in plain text, so assert the attribute
      // — querying for the absence of a textbox passes for the wrong reason.
      const fields = within(privateCard).getAllByRole("textbox");

      expect(fields.length).toBeGreaterThan(0);
      fields.forEach(field => expect(field).toHaveAttribute("readonly"));

      // ...and there is nothing to delete with or add to.
      expect(within(privateCard).queryByTestId("delete-field-0")).not.toBeInTheDocument();
      expect(within(privateCard).queryByTestId("add-field")).not.toBeInTheDocument();
    });

    it("leaves PUBLIC metadata editable when set — it is not a blanket lock", async () => {
      // Arrange
      const user = userEvent.setup();

      render(<MetadataDialog {...withData} readonlyPrivateMetadata />);

      // Act
      await expandBoth(user);

      // Assert
      const [publicCard] = cards();

      const publicFields = within(publicCard).getAllByRole("textbox");

      expect(publicFields.length).toBeGreaterThan(0);
      publicFields.forEach(field => expect(field).not.toHaveAttribute("readonly"));
      expect(within(publicCard).getByTestId("add-field")).toBeInTheDocument();
    });

    it("keeps private metadata editable by default, for every other consumer", async () => {
      // Arrange
      const user = userEvent.setup();

      render(<MetadataDialog {...withData} />);

      // Act
      await expandBoth(user);

      // Assert
      const [, privateCard] = cards();

      const editableFields = within(privateCard).getAllByRole("textbox");

      expect(editableFields.length).toBeGreaterThan(0);
      editableFields.forEach(field => expect(field).not.toHaveAttribute("readonly"));
      expect(within(privateCard).getByTestId("add-field")).toBeInTheDocument();
    });
  });
});
