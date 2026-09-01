import { ProductErrorCode } from "@dashboard/graphql";
import { ThemeProvider } from "@saleor/macaw-ui-next";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PublishOnChannelButton, type PublishOnChannelButtonProps } from "./PublishOnChannelButton";

const mockNotify = jest.fn();
const mockPublish = jest.fn();

jest.mock("@dashboard/hooks/useNotifier", () => ({
  useNotifier: () => mockNotify,
}));
// The generated hook itself is mocked rather than the network layer: the point of these
// tests is what the component does with the mutation's PAYLOAD, and document matching in
// MockedProvider would make that brittle without testing anything extra.
jest.mock("@dashboard/graphql", () => ({
  ...(jest.requireActual("@dashboard/graphql") as object),
  useProductChannelListingUpdateMutation: () => [mockPublish, { loading: false }],
}));

const CHANNEL_ID = "Q2hhbm5lbDo0";
const TEST_ID = `publish-on-channel-${CHANNEL_ID}`;

const defaultProps: PublishOnChannelButtonProps = {
  productId: "UHJvZHVjdDoxNTEyOQ==",
  channelId: CHANNEL_ID,
  channelName: "Fífa",
  listing: { isPublished: false, visibleInListings: false, isAvailableForPurchase: false },
  hasCategory: true,
  hasUnsavedChanges: false,
  disabled: false,
  onPublished: jest.fn(),
};

const renderButton = (overrides: Partial<PublishOnChannelButtonProps> = {}) =>
  render(
    <ThemeProvider>
      <PublishOnChannelButton {...defaultProps} {...overrides} />
    </ThemeProvider>,
  );

describe("PublishOnChannelButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPublish.mockResolvedValue({
      data: {
        productChannelListingUpdate: { errors: [], product: { id: "UHJvZHVjdDoxNTEyOQ==" } },
      },
    });
  });

  it("offers nothing once the channel is fully published", () => {
    // Arrange & Act
    renderButton({
      listing: { isPublished: true, visibleInListings: true, isAvailableForPurchase: true },
    });

    // Assert
    expect(screen.queryByTestId(TEST_ID)).not.toBeInTheDocument();
  });

  it("offers to finish a half-published channel", () => {
    // Arrange & Act
    renderButton({
      listing: { isPublished: true, visibleInListings: false, isAvailableForPurchase: false },
    });

    // Assert
    expect(screen.getByTestId(TEST_ID)).toHaveTextContent("Finish publishing on Fífa");
  });

  it("sets published, visible and available in a single mutation", async () => {
    // Arrange
    const onPublished = jest.fn();

    renderButton({ onPublished });

    // Act
    await userEvent.click(screen.getByTestId(TEST_ID));

    // Assert
    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith({
        variables: {
          id: "UHJvZHVjdDoxNTEyOQ==",
          input: {
            updateChannels: [
              {
                channelId: CHANNEL_ID,
                isPublished: true,
                visibleInListings: true,
                isAvailableForPurchase: true,
              },
            ],
          },
        },
      });
    });
    expect(mockNotify).toHaveBeenCalledWith({ status: "success", text: "Published on Fífa." });
    expect(onPublished).toHaveBeenCalled();
  });

  it("reports a refusal carried in the payload rather than reading it as success", async () => {
    // Arrange — Saleor leaves the top-level GraphQL errors empty and refuses in the payload.
    const onPublished = jest.fn();

    mockPublish.mockResolvedValue({
      data: {
        productChannelListingUpdate: {
          errors: [
            {
              code: ProductErrorCode.PRODUCT_WITHOUT_CATEGORY,
              field: "isPublished",
              message: "You must select a category to be able to publish.",
              channels: [CHANNEL_ID],
            },
          ],
          product: null,
        },
      },
    });
    renderButton({ onPublished });

    // Act
    await userEvent.click(screen.getByTestId(TEST_ID));

    // Assert
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        status: "error",
        text: "Saleor will not publish a product without a category. Set one in Organize Product, save, then publish.",
      });
    });
    expect(onPublished).not.toHaveBeenCalled();
  });

  it("stays disabled, with the reason, while the product has no saved category", () => {
    // Arrange & Act
    renderButton({ hasCategory: false });

    // Assert
    expect(screen.getByTestId(TEST_ID)).toBeDisabled();
    expect(
      screen.getByText(
        "Add a category before publishing — Saleor will not publish a product without one.",
      ),
    ).toBeInTheDocument();
  });

  it("stays disabled while the channel has unsaved availability edits", () => {
    // Arrange & Act
    renderButton({ hasUnsavedChanges: true });

    // Assert
    expect(screen.getByTestId(TEST_ID)).toBeDisabled();
    expect(
      screen.getByText(
        "Save your availability changes for this channel first — publishing now would write over them.",
      ),
    ).toBeInTheDocument();
  });
});
