// @ts-strict-ignore
/**
 * Craftware: per-store category for multi-store products (Örninn FEAT-185).
 *
 * Saleor gives a product exactly ONE `category`, but Örninn sell the same product in up to three
 * brand stores whose category trees are independent namespaces (`hjol-*`, `golf-*`, `fifa-*`).
 * A bike travel cover filed under hjol's accessories has no sensible home in golf's tree unless a
 * human picks one, and nothing can infer it.
 *
 * The workaround, shipped as Örninn FEAT-024, is public metadata `category_<channelSlug>` holding
 * a category SLUG. Their Meilisearch indexer and storefront product pages read it to decide which
 * category the product appears under in each store; without it the product falls back to its
 * canonical category, which means it shows on NO category page in the second store and leaks the
 * first store's root category name into the second store's filters.
 *
 * ⚠️ The value is a category **slug**, not an id — the rest of the dashboard's category machinery
 * is id-based, so do not "fix" this to match. ⚠️ And this control writes through the product FORM,
 * not the metadata dialog: Saleor fires no PRODUCT_UPDATED for `updateMetadata`, so a value saved
 * that way would never reach the search index and the store would silently stay wrong.
 */
import { DashboardCard } from "@dashboard/components/Card";
import { type FetchMoreProps } from "@dashboard/types";
import { Box, DynamicCombobox, type Option, Text } from "@saleor/macaw-ui-next";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";

export interface PseudoCategoryChannel {
  id: string;
  slug: string;
  name: string;
}

export interface ProductPseudoCategoriesProps {
  /** Channels the product is listed in, from live form state — not the saved listings. */
  channels: PseudoCategoryChannel[];
  /** channelSlug → category slug. */
  value: Record<string, string>;
  /** Category options whose `value` is the category SLUG. */
  categories: Option[];
  disabled: boolean;
  fetchCategories: (query: string) => void;
  fetchMoreCategories: FetchMoreProps;
  onChange: (channelSlug: string, categorySlug: string) => void;
}

export const ProductPseudoCategories = ({
  channels,
  value,
  categories,
  disabled,
  fetchCategories,
  fetchMoreCategories,
  onChange,
}: ProductPseudoCategoriesProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  // Referential identity matters: DynamicCombobox is Downshift-backed and compares selectedItem
  // by reference, so a fresh object each render resets the input text while someone is typing.
  const values = useMemo<Record<string, Option | null>>(
    () =>
      Object.fromEntries(
        channels.map(channel => {
          const slug = value[channel.slug];

          return [
            channel.slug,
            slug
              ? { value: slug, label: categories.find(c => c.value === slug)?.label ?? slug }
              : null,
          ];
        }),
      ),
    [channels, value, categories],
  );

  // One store is the ordinary case and needs no per-store override — the product's own category
  // already serves it. Showing an empty card on every product would be noise on ~7,500 of them.
  if (channels.length < 2) {
    return null;
  }

  return (
    <DashboardCard data-test-id="product-pseudo-categories">
      <DashboardCard.Header>
        <DashboardCard.Title>
          <FormattedMessage
            id="QjSJs+"
            defaultMessage="Category per store"
            description="section header, multi-store product"
          />
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <Text size={2} color="default2" display="block" paddingBottom={4}>
          <FormattedMessage
            id="caY4gG"
            defaultMessage="This product is sold in more than one store. Choose where it belongs in each store's categories. Without this it will not appear on any category page in the other store."
            description="help text, multi-store product category"
          />
        </Text>
        {channels.map(channel => (
          <Box key={channel.id} paddingBottom={4} data-test-id={`pseudo-category-${channel.slug}`}>
            <DynamicCombobox
              disabled={disabled}
              options={disabled ? [] : categories}
              value={values[channel.slug]}
              loading={fetchMoreCategories?.loading}
              name={`category_${channel.slug}`}
              label={channel.name}
              id={`pseudo-category-${channel.slug}`}
              onChange={option => onChange(channel.slug, option?.value ?? "")}
              onInputValueChange={fetchCategories}
              onFocus={() => {
                setActiveChannel(channel.slug);
                fetchCategories("");
              }}
              onBlur={() => setActiveChannel(null)}
              onScrollEnd={() => {
                if (fetchMoreCategories.hasMore) {
                  fetchMoreCategories.onFetchMore();
                }
              }}
              startAdornment={val => {
                if (activeChannel === channel.slug || disabled || !val) {
                  return undefined;
                }

                return categories.find(category => category.value === val.value)?.startAdornment;
              }}
            />
          </Box>
        ))}
      </DashboardCard.Content>
    </DashboardCard>
  );
};

ProductPseudoCategories.displayName = "ProductPseudoCategories";
export default ProductPseudoCategories;
