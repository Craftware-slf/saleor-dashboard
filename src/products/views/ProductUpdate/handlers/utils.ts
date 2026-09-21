// @ts-strict-ignore
import { type FetchResult } from "@apollo/client";
import { getAttributesAfterFileAttributesUpdate } from "@dashboard/attributes/utils/data";
import { prepareAttributesInput } from "@dashboard/attributes/utils/handlers";
import { type DatagridChangeOpts } from "@dashboard/components/Datagrid/hooks/useDatagridChange";
import {
  type FileUploadMutation,
  type ProductChannelListingAddInput,
  type ProductChannelListingUpdateInput,
  type ProductChannelListingUpdateMutationVariables,
  type ProductFragment,
  type ProductUpdateMutationVariables,
  type ProductVariantBulkUpdateInput,
  type VariantAttributeFragment,
} from "@dashboard/graphql";
import { weight } from "@dashboard/misc";
import { type ProductUpdateSubmitData } from "@dashboard/products/components/ProductUpdatePage/types";
import {
  getAttributeInputFromProduct,
  PSEUDO_CATEGORY_PREFIX,
} from "@dashboard/products/utils/data";
import { getParsedDataForJsonStringField } from "@dashboard/utils/richText/misc";
import pick from "lodash/pick";
import uniq from "lodash/uniq";

import { getAttributeData, getAttributeInput, getAttributeType } from "./data/attributes";
import { getUpdateVariantChannelInputs, getVariantChannelsInputs } from "./data/channel";
import { getNameData } from "./data/name";
import { getSkuData } from "./data/sku";
import { getStockData, getVaraintUpdateStockData } from "./data/stock";

export function getProductUpdateVariables(
  product: ProductFragment,
  data: ProductUpdateSubmitData,
  uploadFilesResult: Array<FetchResult<FileUploadMutation>>,
) {
  const updatedFileAttributes = getAttributesAfterFileAttributesUpdate(
    data.attributesWithNewFileValue,
    uploadFilesResult,
  );

  const variables: ProductUpdateMutationVariables = {
    id: product.id,
    input: {
      attributes: prepareAttributesInput({
        attributes: data.attributes,
        prevAttributes: getAttributeInputFromProduct(product),
        updatedFileAttributes,
      }),
    },
  };

  if (data.category) {
    variables.input["category"] = data.category;
  }

  if (data.collections) {
    variables.input["collections"] = data.collections.map(collection => collection.value);
  }

  if (data.description) {
    variables.input["description"] = getParsedDataForJsonStringField(data.description);
  }

  if (data.name) {
    variables.input["name"] = data.name;
  }

  if (data.rating) {
    variables.input["rating"] = data.rating;
  }

  if (data.slug) {
    variables.input["slug"] = data.slug;
  }

  if (data.taxClassId) {
    variables.input["taxClass"] = data.taxClassId;
  }

  if (data.seoDescription || data.seoTitle) {
    variables.input["seo"] = {};
  }

  if (data.seoDescription && variables.input["seo"]) {
    variables.input["seo"].description = data.seoDescription;
  }

  if (data.seoTitle && variables.input["seo"]) {
    variables.input["seo"].title = data.seoTitle;
  }

  if (data.weight !== undefined) {
    variables.input["weight"] = weight(data.weight);
  }

  // ── Craftware: per-store category overrides (Örninn FEAT-185) ──────────────────────────────
  // Written here, inside `productUpdate`, and deliberately NOT through the metadata dialog: that
  // dialog calls `updateMetadata`, for which Saleor fires no PRODUCT_UPDATED — so the value would
  // save correctly, show a success toast, and never reach the search index. The store would stay
  // wrong with nothing reporting it. Riding on productUpdate is the whole point of this control.
  //
  // `input.metadata` MERGES (verified against this Saleor version): writing one key leaves every
  // other key on the product intact, which matters because these products carry wc_id, video_url,
  // specifications, also_in and more.
  //
  // A cleared selection is written as "" rather than deleted — removing a key needs a separate
  // deleteMetadata call, and an empty value already reads as "no override" downstream, where the
  // indexer falls back to the canonical category on any falsy value.
  if (data.pseudoCategories) {
    const previousKeys = (product.metadata ?? [])
      .map(entry => entry.key)
      .filter(key => key.startsWith(PSEUDO_CATEGORY_PREFIX));
    const nextKeys = Object.keys(data.pseudoCategories).map(
      slug => `${PSEUDO_CATEGORY_PREFIX}${slug}`,
    );

    variables.input["metadata"] = [...new Set([...previousKeys, ...nextKeys])].map(key => ({
      key,
      value: data.pseudoCategories[key.slice(PSEUDO_CATEGORY_PREFIX.length)] ?? "",
    }));
  }

  return variables;
}

export function getCreateVariantInput(
  data: DatagridChangeOpts,
  index: number,
  variantAttributes: VariantAttributeFragment[],
) {
  return {
    attributes: getAttributeData(data.updates, index, variantAttributes),
    sku: getSkuData(data.updates, index),
    name: getNameData(data.updates, index),
    channelListings: getVariantChannelsInputs(data, index),
    stocks: getStockData(data.updates, index),
  };
}

export function getProductChannelsUpdateVariables(
  product: ProductFragment,
  data: ProductUpdateSubmitData,
): ProductChannelListingUpdateMutationVariables {
  const channels = inferProductChannelsAfterUpdate(product, data);
  const dataUpdated = new Map<string, ProductChannelListingAddInput>();

  data.channels.updateChannels
    .map(listing => {
      // Always include date fields - they're needed for scheduling
      // Saleor's scheduling works by: isPublished=true + publishedAt=futureDate
      // Similarly: isAvailableForPurchase=true + availableForPurchaseAt=futureDate
      const fieldsToPick = [
        "channelId",
        "isAvailableForPurchase",
        "availableForPurchaseAt",
        "isPublished",
        "publishedAt",
        "visibleInListings",
      ] as Array<keyof ProductChannelListingAddInput>;

      return pick(
        listing,
        // Filtering it here so we send only fields defined in input schema
        fieldsToPick,
      );
    })
    .forEach(listing => dataUpdated.set(listing.channelId, listing));

  const updateChannels = channels
    .filter(channelId => dataUpdated.has(channelId))
    .map(channelId => {
      const data = dataUpdated.get(channelId);

      return {
        ...data,
        // Only force isAvailableForPurchase=true when there's an actual date set
        isAvailableForPurchase:
          data.availableForPurchaseAt !== null && data.availableForPurchaseAt !== undefined
            ? true
            : data.isAvailableForPurchase,
      };
    });

  return {
    id: product.id,
    input: {
      ...data.channels,
      updateChannels,
    },
  };
}

export function hasProductChannelsUpdate(data: ProductChannelListingUpdateInput) {
  return data?.removeChannels?.length || data?.updateChannels?.length;
}

export function getBulkVariantUpdateInputs(
  variants: ProductFragment["variants"],
  data: DatagridChangeOpts,
  variantsAttributes: VariantAttributeFragment[],
): ProductVariantBulkUpdateInput[] {
  const toUpdateInput = createToUpdateInput(data, variantsAttributes);

  return variants
    .filter((_, index) => !data.removed.includes(index))
    .map(toUpdateInput)
    .filter(byAvailability)
    .filter((_, index) => !data.added.includes(index));
}

const createToUpdateInput =
  (data: DatagridChangeOpts, variantsAttributes: VariantAttributeFragment[]) =>
  (
    variant: ProductFragment["variants"][number],
    variantIndex: number,
  ): ProductVariantBulkUpdateInput => ({
    id: variant.id,
    attributes: getVariantAttributesForUpdate(data, variantIndex, variant, variantsAttributes),
    sku: getSkuData(data.updates, variantIndex),
    name: getNameData(data.updates, variantIndex),
    stocks: getVaraintUpdateStockData(data.updates, variantIndex, variant),
    channelListings: getUpdateVariantChannelInputs(data, variantIndex, variant),
  });
const getVariantAttributesForUpdate = (
  data: DatagridChangeOpts,
  variantIndex: number,
  variant: ProductFragment["variants"][number],
  variantsAttributes: VariantAttributeFragment[],
) => {
  const updatedAttributes = getAttributeData(data.updates, variantIndex, variantsAttributes);

  if (!updatedAttributes.length) {
    return [];
  }

  // Re-send current values for all not-updated attributes, in case some of them were required
  const notUpdatedAttributes: ReturnType<typeof getAttributeData> = variant.attributes
    .filter(
      attribute =>
        !updatedAttributes.find(updatedAttribute => updatedAttribute.id === attribute.attribute.id),
    )
    .map(attribute => {
      const attributeType = getAttributeType(variantsAttributes, attribute.attribute.id);

      if (!attributeType) {
        return undefined;
      }

      return {
        id: attribute.attribute.id,
        ...getAttributeInput(attributeType, attribute.values),
      };
    });

  return [...updatedAttributes, ...notUpdatedAttributes];
};
const byAvailability = (variant: ProductVariantBulkUpdateInput): boolean =>
  variant.name !== undefined ||
  variant.sku !== undefined ||
  variant.attributes.length > 0 ||
  variant.stocks.create.length > 0 ||
  variant.stocks.update.length > 0 ||
  variant.stocks.remove.length > 0 ||
  variant.channelListings.update.length > 0 ||
  variant.channelListings.remove.length > 0 ||
  variant.channelListings.create.length > 0;

export function inferProductChannelsAfterUpdate(
  product: ProductFragment,
  data: ProductUpdateSubmitData,
) {
  const productChannelsIds = product.channelListings.map(listing => listing.channel.id);
  const updatedChannelsIds = data.channels.updateChannels?.map(listing => listing.channelId) || [];
  const removedChannelsIds = data.channels.removeChannels || [];

  return uniq([
    ...productChannelsIds.filter(channelId => !removedChannelsIds.includes(channelId)),
    ...updatedChannelsIds,
  ]);
}

export function byAttributeName(x: string | null | undefined): x is string {
  return typeof x === "string" && x.length > 0;
}
