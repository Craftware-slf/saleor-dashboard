import type { Meta, StoryObj } from "@storybook/react-vite";
import { CategoryFactory } from "@storybookUtils/AssignDialogShared/factories";
import { type ComponentProps } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import AssignCategoryDialog from "./AssignCategoryDialog";

type Props = ComponentProps<typeof AssignCategoryDialog>;

const meta: Meta<typeof AssignCategoryDialog> = {
  title: "Components/Dialogs/AssignCategoryDialog",
  component: AssignCategoryDialog,
  loaders: [async () => ({ categories: await CategoryFactory.buildList(8) })],
  render: (args: Props, { loaded }: { loaded: { categories: Props["categories"] } }) => (
    <AssignCategoryDialog {...args} categories={args.categories ?? loaded.categories} />
  ),
  argTypes: {
    confirmButtonState: {
      control: "inline-radio",
      options: ["default", "loading", "success", "error"],
    },
    onClose: { table: { disable: true } },
    onFetch: { table: { disable: true } },
    onFetchMore: { table: { disable: true } },
    onSubmit: { table: { disable: true } },
    categories: { table: { disable: true } },
    labels: { table: { disable: true } },
  },
  args: {
    open: true,
    loading: false,
    hasMore: false,
    confirmButtonState: "default",
    onClose: fn(),
    onFetch: fn(),
    onFetchMore: fn(),
    onSubmit: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof AssignCategoryDialog>;

// Dialog renders in a Radix portal, so we find the dialog element by role and query within it
const findDialog = async () => {
  const body = within(document.body);
  const dialog = await body.findByRole("dialog");

  return within(dialog);
};

export const Default: Story = {
  play: async ({ args, loaded }: { args: Props; loaded: { categories: Props["categories"] } }) => {
    // Arrange — wait for dialog to render in portal
    const dialog = await findDialog();
    const rows = await dialog.findAllByTestId("dialog-row");
    const checkboxes = rows.map(row => within(row).getByRole("checkbox"));

    // Act — select first two categories
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);
    await userEvent.click(dialog.getByTestId("assign-and-save-button"));

    // Assert
    await expect(args.onSubmit).toHaveBeenCalledOnce();

    const submittedItems = (args.onSubmit as ReturnType<typeof fn>).mock.calls[0][0];

    await expect(submittedItems).toHaveLength(2);
    await expect(submittedItems[0]).toMatchObject({
      id: loaded.categories![0].id,
      name: "Apparel",
    });
    await expect(submittedItems[1]).toMatchObject({
      id: loaded.categories![1].id,
      name: "Electronics",
    });
  },
};

export const SingleSelection: Story = {
  args: { selectionMode: "single" },
  play: async ({ args, loaded }: { args: Props; loaded: { categories: Props["categories"] } }) => {
    // Arrange
    const dialog = await findDialog();
    const rows = await dialog.findAllByTestId("dialog-row");

    // Act — click second category row, then submit
    await userEvent.click(rows[1]);
    await userEvent.click(dialog.getByTestId("assign-and-save-button"));

    // Assert
    await expect(args.onSubmit).toHaveBeenCalledOnce();

    const submittedItems = (args.onSubmit as ReturnType<typeof fn>).mock.calls[0][0];

    await expect(submittedItems).toHaveLength(1);
    await expect(submittedItems[0]).toMatchObject({
      id: loaded.categories![1].id,
      name: "Electronics",
    });
  },
};

export const SingleSelectionChange: Story = {
  args: { selectionMode: "single" },
  play: async ({ args, loaded }: { args: Props; loaded: { categories: Props["categories"] } }) => {
    // Arrange
    const dialog = await findDialog();
    const rows = await dialog.findAllByTestId("dialog-row");

    // Act — select first, then change to third, then submit
    await userEvent.click(rows[0]);
    await userEvent.click(rows[2]);
    await userEvent.click(dialog.getByTestId("assign-and-save-button"));

    // Assert — only the last selected category is submitted
    await expect(args.onSubmit).toHaveBeenCalledOnce();

    const submittedItems = (args.onSubmit as ReturnType<typeof fn>).mock.calls[0][0];

    await expect(submittedItems).toHaveLength(1);
    await expect(submittedItems[0]).toMatchObject({
      id: loaded.categories![2].id,
      name: "Home & Garden",
    });
  },
};

export const SearchTriggersOnFetch: Story = {
  play: async ({ args }: { args: Props }) => {
    // Arrange
    const dialog = await findDialog();
    const searchInput = await dialog.findByPlaceholderText("Search by category name, etc...");

    // Act
    await userEvent.type(searchInput, "electronics");

    // Assert
    await expect(args.onFetch).toHaveBeenCalled();
  },
};

export const CloseDialog: Story = {
  play: async ({ args }: { args: Props }) => {
    // Arrange
    const dialog = await findDialog();
    const backButton = await dialog.findByTestId("back");

    // Act
    await userEvent.click(backButton);

    // Assert
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const Loading: Story = {
  args: { loading: true, categories: [] },
  play: async () => {
    // Arrange
    const dialog = await findDialog();

    // Assert — no rows visible during loading
    const rows = dialog.queryAllByTestId("dialog-row");

    await expect(rows).toHaveLength(0);
  },
};

export const Empty: Story = {
  args: { categories: [] },
  play: async () => {
    // Arrange
    const dialog = await findDialog();

    // Assert — empty message visible and no rows
    await expect(await dialog.findByText("No categories found")).toBeInTheDocument();

    const rows = dialog.queryAllByTestId("dialog-row");

    await expect(rows).toHaveLength(0);
  },
};

export const HasMore: Story = {
  args: { hasMore: true },
};

// Craftware (Örninn FEAT-263): same-named categories under different trees are told apart by their
// full path, with ancestors ordered by level even when the API returns them out of order.
const pathNode = (
  id: string,
  name: string,
  level: number,
): { node: { __typename: "Category"; id: string; name: string; level: number } } => ({
  node: { __typename: "Category" as const, id, name, level },
});

export const WithCategoryPath: Story = {
  args: {
    categories: [
      {
        id: "cat-shirts-clothing",
        name: "Shirts",
        fullPath: {
          edges: [
            pathNode("men-1", "Men", 2),
            pathNode("root-hjol", "Örninn Hjól", 0),
            pathNode("clothing", "Clothing", 1),
          ],
        },
      },
      {
        id: "cat-shirts-outlet",
        name: "Shirts",
        fullPath: {
          edges: [
            pathNode("root-hjol", "Örninn Hjól", 0),
            pathNode("outlet", "Outlet", 1),
            pathNode("men-2", "Men", 2),
          ],
        },
      },
      { id: "root-golf", name: "Örninn Golf Shop", fullPath: { edges: [] } },
    ],
  },
  play: async () => {
    const dialog = await findDialog();
    const rows = await dialog.findAllByTestId("dialog-row");

    await expect(rows).toHaveLength(3);
    await expect(rows[0]).toHaveTextContent("Örninn Hjól / Clothing / Men / Shirts");
    await expect(rows[1]).toHaveTextContent("Örninn Hjól / Outlet / Men / Shirts");
    // A root category has no path prefix.
    await expect(within(rows[2]).queryByTestId("category-path-prefix")).toBeNull();
  },
};
