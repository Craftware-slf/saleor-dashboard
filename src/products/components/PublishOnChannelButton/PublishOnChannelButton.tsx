import { ProductErrorCode, useProductChannelListingUpdateMutation } from "@dashboard/graphql";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { type FC } from "react";

// Craftware: publish a product on one channel in a single click (FEAT-144).
//
// The Availability card above can already do this, but only by expanding the channel and
// setting three separate controls. That matters more than it sounds: setting isPublished
// on its own leaves a product that reads as published in the dashboard and cannot be found
// or bought, because visibleInListings and isAvailableForPurchase are still off. This
// button always sets all three together, so there is no half-published state to land in.
//
// One button per channel, matching the Preview on storefront buttons (FEAT-069) — a
// product sold under more than one brand is published per brand, not everywhere at once.

/** The saved availability of one channel — what the server currently holds, not form state. */
export interface ChannelPublishState {
  isPublished: boolean;
  visibleInListings: boolean;
  isAvailableForPurchase: boolean;
}

export interface PublishOnChannelButtonProps {
  productId: string;
  channelId: string;
  /** Channel name for the label, so a multi-channel product's buttons are tellable apart. */
  channelName: string;
  listing: ChannelPublishState;
  /**
   * Whether the product has a saved category. Saleor hard-blocks publishing without one —
   * a category chosen in the form but not yet saved does not count, hence "saved".
   */
  hasCategory: boolean;
  /** This channel's availability has edits that have not been saved yet. */
  hasUnsavedChanges: boolean;
  disabled: boolean;
  /** Called after a successful publish so the page can refetch the product. */
  onPublished: () => void;
}

/**
 * Saleor reports a refused mutation in the PAYLOAD's `errors` and leaves the top-level
 * GraphQL errors empty, so a handler that only catches thrown errors reads a refusal as a
 * success. The refusal that actually happens here is PRODUCT_WITHOUT_CATEGORY: Saleor
 * blocks publishing a product with no category, while a missing image, description or
 * translation does not block it at all.
 */
const refusalText = (
  error: { code: ProductErrorCode; message: string | null },
  channelName: string,
): string => {
  if (error.code === ProductErrorCode.PRODUCT_WITHOUT_CATEGORY) {
    return "Saleor will not publish a product without a category. Set one in Organize Product, save, then publish.";
  }

  return error.message ?? `Could not publish on ${channelName} (${error.code}).`;
};

export const PublishOnChannelButton: FC<PublishOnChannelButtonProps> = ({
  productId,
  channelId,
  channelName,
  listing,
  hasCategory,
  hasUnsavedChanges,
  disabled,
  onPublished,
}) => {
  const notify = useNotifier();
  const [publishOnChannel, { loading }] = useProductChannelListingUpdateMutation();

  // Nothing to offer once the channel is fully live — the Availability card is the place
  // to take a product back down, and a button that only ever publishes should not pretend
  // to be a toggle.
  const isFullyPublished =
    listing.isPublished && listing.visibleInListings && listing.isAvailableForPurchase;

  if (isFullyPublished) {
    return null;
  }

  // Stated up front rather than discovered by clicking. The payload check below is still
  // the real guard: Saleor is the authority on what it will refuse, not this list.
  const blockedReason = !hasCategory
    ? "Add a category before publishing — Saleor will not publish a product without one."
    : hasUnsavedChanges
      ? "Save your availability changes for this channel first — publishing now would write over them."
      : null;

  const onClick = async (): Promise<void> => {
    try {
      const result = await publishOnChannel({
        variables: {
          id: productId,
          input: {
            updateChannels: [
              {
                channelId,
                isPublished: true,
                visibleInListings: true,
                isAvailableForPurchase: true,
              },
            ],
          },
        },
      });

      const error = result.data?.productChannelListingUpdate?.errors?.[0];

      if (error) {
        notify({ status: "error", text: refusalText(error, channelName) });

        return;
      }

      notify({ status: "success", text: `Published on ${channelName}.` });
      onPublished();
    } catch (e) {
      notify({
        status: "error",
        text: e instanceof Error ? e.message : `Could not publish on ${channelName}.`,
      });
    }
  };

  return (
    <Box marginTop={4} display="flex" flexDirection="column" gap={2}>
      <Button
        variant="primary"
        onClick={onClick}
        disabled={disabled || loading || blockedReason !== null}
        data-test-id={`publish-on-channel-${channelId}`}
      >
        {loading
          ? "Publishing…"
          : listing.isPublished
            ? `Finish publishing on ${channelName}`
            : `Publish on ${channelName}`}
      </Button>
      <Text size={2} color="default2">
        {blockedReason ??
          (listing.isPublished
            ? "Published, but still hidden from listings or not available to buy. This sets all three."
            : "Sets published, visible in listings and available for purchase, in one step.")}
      </Text>
    </Box>
  );
};

PublishOnChannelButton.displayName = "PublishOnChannelButton";
