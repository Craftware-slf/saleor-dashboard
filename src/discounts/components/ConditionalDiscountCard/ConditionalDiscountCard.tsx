import { getCategoryPathLabel } from "@dashboard/categories/utils/categoryPath";
import { DashboardCard } from "@dashboard/components/Card";
import { Multiselect } from "@dashboard/components/Combobox";
import { useCategorieOptions } from "@dashboard/discounts/components/DiscountRules/componenets/RuleForm/components/RuleConditionValues/hooks/options/useCategorieOptions";
import { useCollectionOptions } from "@dashboard/discounts/components/DiscountRules/componenets/RuleForm/components/RuleConditionValues/hooks/options/useCollectionOptions";
import { useProductOptions } from "@dashboard/discounts/components/DiscountRules/componenets/RuleForm/components/RuleConditionValues/hooks/options/useProductOptions";
import { describeConditionalRule, idList } from "@dashboard/discounts/conditional/conditionalRule";
import {
  automaticConditionalText,
  type ConditionalField,
  conditionalFormToRule,
  type ConditionalFormValues,
  type DiscountKind,
  type QuantityMode,
} from "@dashboard/discounts/conditional/form";
import { conditionalMessages as messages } from "@dashboard/discounts/conditional/messages";
import { useBrandPageOptions } from "@dashboard/discounts/conditional/useBrandPageOptions";
import { type DiscoutFormData } from "@dashboard/discounts/types";
import {
  type ChannelFragment,
  useConditionalBrandNamesQuery,
  useRuleConditionsSelectedOptionsDetailsQuery,
} from "@dashboard/graphql";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import { Box, Checkbox, Input, type Option, Select, Text, Toggle } from "@saleor/macaw-ui-next";
import isEqual from "lodash/isEqual";
import { type ReactNode, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface ConditionalDiscountCardProps {
  channels: ChannelFragment[];
  disabled: boolean;
}

type ItemKey = "products" | "categories" | "collections" | "brands";

const noop = (): void => undefined;

const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/** Option[] out of the Combobox Multiselect change event. */
const optionsOf = (event: { target: { value: unknown } }): Option[] =>
  Array.isArray(event.target.value) ? (event.target.value as Option[]) : [];

/**
 * The editor for an Örninn conditional discount (FEAT-246): channels, the items it applies
 * to, the quantity rule, the discount and the optional banner text. Its values live in the
 * page form under `conditional` and are saved to the promotion's `orninn_conditional`
 * metadata by the view's submit handler.
 */
export const ConditionalDiscountCard = ({
  channels,
  disabled,
}: ConditionalDiscountCardProps): JSX.Element => {
  const intl = useIntl();
  const { watch, getValues, setValue, trigger, formState } = useFormContext<DiscoutFormData>();
  const { isSubmitted } = formState;
  const form = watch("conditional");
  const readOnly = disabled || form.unsupported !== null;
  const errors = (formState.errors.conditional ?? {}) as Partial<
    Record<ConditionalField, { message?: string }>
  >;

  // The macaw Select / Multiselect re-emit onChange with their current value when they
  // re-render, so `update` reads the latest form values (never this render's closure, which
  // can be stale) and ignores a patch that changes nothing — otherwise a re-emitted value
  // could overwrite a newer edit, or re-render and re-emit forever.
  const update = (patch: Partial<ConditionalFormValues>): void => {
    const current = getValues("conditional");

    if (Object.entries(patch).every(([k, v]) => isEqual(current[k as keyof typeof current], v))) {
      return;
    }

    setValue("conditional", { ...current, ...patch }, { shouldDirty: true });

    // After a failed save, keep the inline errors in step with the edits.
    if (isSubmitted) {
      void trigger("conditional");
    }
  };

  // Labels for ids already saved in the rule (picked ones carry their own label).
  const storedItems = (form.original?.condition as { items?: Record<string, unknown> } | undefined)
    ?.items;
  const storedIds = {
    // Excluded products (FEAT-260) take their labels from the same query.
    productsIds: [
      ...new Set([...idList(storedItems?.products), ...idList(form.original?.excludedProducts)]),
    ],
    categoriesIds: idList(storedItems?.categories),
    collectionsIds: idList(storedItems?.collections),
    variantsIds: [] as string[],
  };
  const { data: storedLabels } = useRuleConditionsSelectedOptionsDetailsQuery({
    variables: storedIds,
    skip:
      storedIds.productsIds.length +
        storedIds.categoriesIds.length +
        storedIds.collectionsIds.length ===
      0,
  });
  const storedBrandIds = idList(storedItems?.brands);
  const { data: storedBrandLabels } = useConditionalBrandNamesQuery({
    variables: { ids: storedBrandIds },
    skip: storedBrandIds.length === 0,
  });
  const [pickedLabels, setPickedLabels] = useState<Record<string, string>>({});
  const labels = useMemo(() => {
    const out: Record<string, string> = {};
    const nodes: Array<{ id: string; name: string }> = [
      ...(mapEdgesToItems(storedLabels?.products) ?? []),
      ...(mapEdgesToItems(storedLabels?.categories) ?? []),
      ...(mapEdgesToItems(storedLabels?.collections) ?? []),
    ];

    for (const node of nodes) {
      out[node.id] = node.name;
    }

    // Craftware (Örninn FEAT-263): saved categories read as full paths.
    for (const category of mapEdgesToItems(storedLabels?.categories) ?? []) {
      out[category.id] = getCategoryPathLabel(category);
    }

    for (const page of mapEdgesToItems(storedBrandLabels?.pages) ?? []) {
      out[page.id] = page.title;
    }

    return { ...out, ...pickedLabels };
  }, [storedLabels, storedBrandLabels, pickedLabels]);

  const searchChannel = form.channels[0] ?? channels[0]?.slug ?? null;
  const productOptions = useProductOptions(searchChannel, "product");
  const categoryOptions = useCategorieOptions(searchChannel, "category");
  const collectionOptions = useCollectionOptions(searchChannel, "collection");
  const brandOptions = useBrandPageOptions(searchChannel);
  const excludedOptions = useProductOptions(searchChannel, "product");
  const pickers: Array<{ key: ItemKey; label: string; fetch: typeof productOptions }> = [
    { key: "products", label: intl.formatMessage(messages.products), fetch: productOptions },
    { key: "categories", label: intl.formatMessage(messages.categories), fetch: categoryOptions },
    {
      key: "collections",
      label: intl.formatMessage(messages.collections),
      fetch: collectionOptions,
    },
    { key: "brands", label: intl.formatMessage(messages.brands), fetch: brandOptions },
  ];

  // The pickers re-emit onChange whenever their `value` changes identity, so the values are
  // memoised on the form's arrays (which keep their identity until edited) and an unchanged
  // selection is never written back — otherwise the two would loop.
  const itemValues = useMemo(
    () => ({
      products: form.products.map(id => ({ value: id, label: labels[id] ?? id })),
      categories: form.categories.map(id => ({ value: id, label: labels[id] ?? id })),
      collections: form.collections.map(id => ({ value: id, label: labels[id] ?? id })),
      brands: form.brands.map(id => ({ value: id, label: labels[id] ?? id })),
      excludedProducts: form.excludedProducts.map(id => ({ value: id, label: labels[id] ?? id })),
    }),
    [form.products, form.categories, form.collections, form.brands, form.excludedProducts, labels],
  );

  const onItemsChange = (key: ItemKey | "excludedProducts", options: Option[]): void => {
    const ids = options.map(o => o.value);

    if (sameIds(ids, form[key])) {
      return;
    }

    setPickedLabels(prev => ({
      ...prev,
      ...Object.fromEntries(options.map(o => [o.value, o.label])),
    }));
    update({ [key]: ids });
  };

  const channelOptions = useMemo(
    () => channels.map(channel => ({ value: channel.slug, label: channel.name })),
    [channels],
  );
  const channelValue = useMemo(
    () =>
      form.channels.map(slug => ({
        value: slug,
        label: channels.find(c => c.slug === slug)?.name ?? slug,
      })),
    [form.channels, channels],
  );
  const onChannelsChange = (options: Option[]): void => {
    const slugs = options.map(o => o.value);

    if (!sameIds(slugs, form.channels)) {
      update({ channels: slugs });
    }
  };

  const variantCount = idList(
    (form.original?.condition as { items?: Record<string, unknown> } | undefined)?.items?.variants,
  ).length;

  const modeOptions: Array<{ value: QuantityMode; label: string }> = [
    { value: "every", label: intl.formatMessage(messages.modeEvery) },
    { value: "tiers", label: intl.formatMessage(messages.modeTiers) },
    { value: "buyget", label: intl.formatMessage(messages.modeBuyGet) },
  ];
  const kindOptions: Array<{ value: DiscountKind; label: string }> = [
    { value: "percentage", label: intl.formatMessage(messages.kindPercentage) },
    { value: "fixed", label: intl.formatMessage(messages.kindFixed) },
    ...(form.mode === "buyget" || form.discountKind === "free"
      ? [{ value: "free" as const, label: intl.formatMessage(messages.kindFree) }]
      : []),
  ];

  const onModeChange = (mode: QuantityMode): void => {
    const current = getValues("conditional");

    if (mode === current.mode) {
      return;
    }

    // "Free" only makes sense as the M of buy N get M.
    const leavingFree = mode !== "buyget" && current.discountKind === "free";

    update({
      mode,
      repeat: mode === "tiers" ? false : true,
      ...(leavingFree ? { discountKind: "percentage" as const } : {}),
    });
  };

  const autoIs = automaticConditionalText(form, "is");
  const autoEn = automaticConditionalText(form, "en");
  const rule = conditionalFormToRule(form);
  const previewIs = form.labelIs.trim() || (rule ? describeConditionalRule(rule, "is") : null);

  return (
    <DashboardCard data-test-id="conditional-discount-card">
      <DashboardCard.Header>
        <DashboardCard.Title>
          <FormattedMessage {...messages.title} />
        </DashboardCard.Title>
        <DashboardCard.Subtitle>
          <FormattedMessage {...messages.subtitle} />
        </DashboardCard.Subtitle>
      </DashboardCard.Header>
      <DashboardCard.Content display="grid" gap={5}>
        {form.unsupported && (
          <Box
            data-test-id="conditional-unsupported"
            backgroundColor="warning1"
            borderColor="warning1"
            borderStyle="solid"
            borderWidth={1}
            borderRadius={3}
            padding={3}
            display="grid"
            gap={1}
          >
            <Text size={3} fontWeight="medium">
              <FormattedMessage {...messages.unsupportedTitle} />
            </Text>
            <Text size={2}>
              {intl.formatMessage(
                form.unsupported === "crossSell"
                  ? messages.unsupportedCrossSell
                  : form.unsupported === "quantityAll"
                    ? messages.unsupportedQuantityAll
                    : messages.unsupportedUnreadable,
              )}
            </Text>
          </Box>
        )}

        <Box display="grid" gap={1}>
          <Multiselect
            size="medium"
            data-test-id="conditional-channels"
            label={intl.formatMessage(messages.channels)}
            value={channelValue}
            options={channelOptions}
            fetchOptions={noop}
            onChange={event => onChannelsChange(optionsOf(event))}
            disabled={readOnly}
            error={!!errors.channels}
            helperText={errors.channels?.message}
          />
        </Box>

        <Box display="grid" gap={2}>
          <Text size={4} fontWeight="medium">
            <FormattedMessage {...messages.appliesTo} />
          </Text>
          <Text size={2} color="default2">
            <FormattedMessage {...messages.appliesToHint} />
          </Text>
          <Box display="grid" gap={3} __gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))">
            {pickers.map(({ key, label, fetch }) => (
              <Multiselect
                key={key}
                size="medium"
                data-test-id={`conditional-${key}`}
                label={label}
                value={itemValues[key]}
                options={fetch.options}
                fetchOptions={fetch.fetch}
                fetchMore={fetch.fetchMoreProps}
                onChange={event => onItemsChange(key, optionsOf(event))}
                disabled={readOnly}
                error={!!errors.items}
              />
            ))}
          </Box>
          {errors.items?.message && (
            <Text size={2} color="critical1">
              {errors.items.message}
            </Text>
          )}
          {variantCount > 0 && (
            <Text size={2} color="default2">
              <FormattedMessage {...messages.variantsKept} values={{ count: variantCount }} />
            </Text>
          )}
          <Box display="grid" gap={1} marginTop={2}>
            <Multiselect
              size="medium"
              data-test-id="conditional-excluded-products"
              label={intl.formatMessage(messages.excludedProducts)}
              value={itemValues.excludedProducts}
              options={excludedOptions.options}
              fetchOptions={excludedOptions.fetch}
              fetchMore={excludedOptions.fetchMoreProps}
              onChange={event => onItemsChange("excludedProducts", optionsOf(event))}
              disabled={readOnly}
            />
            <Text size={2} color="default2">
              <FormattedMessage {...messages.excludedProductsHint} />
            </Text>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Toggle
              data-test-id="conditional-same-product"
              pressed={form.sameProduct}
              onPressedChange={pressed => update({ sameProduct: pressed })}
              disabled={readOnly}
            />
            <Text size={3} fontWeight="medium">
              <FormattedMessage {...messages.sameProduct} />
            </Text>
            <Text size={2} color="default2">
              {intl.formatMessage(
                form.sameProduct ? messages.sameProductOnHint : messages.sameProductOffHint,
              )}
            </Text>
          </Box>
        </Box>

        <Box display="grid" gap={3} __gridTemplateColumns="repeat(3, minmax(0, 1fr))">
          <Select
            size="medium"
            data-test-id="conditional-mode"
            label={intl.formatMessage(messages.quantityRule)}
            options={modeOptions}
            value={form.mode}
            onChange={value => onModeChange(value as QuantityMode)}
            disabled={readOnly}
          />
          {form.mode === "tiers" ? (
            <Input
              size="medium"
              data-test-id="conditional-tiers"
              label={intl.formatMessage(messages.tiers)}
              value={form.tiers}
              onChange={e => update({ tiers: e.target.value })}
              disabled={readOnly}
              error={!!errors.tiers}
              helperText={errors.tiers?.message ?? intl.formatMessage(messages.tiersHint)}
            />
          ) : (
            <Input
              size="medium"
              type="number"
              min={1}
              data-test-id="conditional-min-quantity"
              label={intl.formatMessage(form.mode === "buyget" ? messages.buyN : messages.everyN)}
              value={form.minQuantity}
              onChange={e => update({ minQuantity: e.target.value })}
              disabled={readOnly}
              error={!!errors.minQuantity}
              helperText={errors.minQuantity?.message}
            />
          )}
          {form.mode === "buyget" && (
            <Input
              size="medium"
              type="number"
              min={1}
              data-test-id="conditional-reward-quantity"
              label={intl.formatMessage(messages.getM)}
              value={form.rewardQuantity}
              onChange={e => update({ rewardQuantity: e.target.value })}
              disabled={readOnly}
              error={!!errors.rewardQuantity}
              helperText={errors.rewardQuantity?.message}
            />
          )}
        </Box>
        {form.mode !== "tiers" && (
          <Box display="flex" alignItems="center" gap={2}>
            <Checkbox
              data-test-id="conditional-repeat"
              checked={form.mode === "every" ? !form.repeat : form.repeat}
              onCheckedChange={checked =>
                update({ repeat: form.mode === "every" ? checked !== true : checked === true })
              }
              disabled={readOnly}
            />
            <Text size={3}>
              {intl.formatMessage(form.mode === "every" ? messages.onceOnly : messages.repeat)}
            </Text>
          </Box>
        )}

        <Box display="grid" gap={3} __gridTemplateColumns="repeat(3, minmax(0, 1fr))">
          <Select
            size="medium"
            data-test-id="conditional-discount-kind"
            label={intl.formatMessage(messages.discount)}
            options={kindOptions}
            value={form.discountKind}
            onChange={value => update({ discountKind: value as DiscountKind })}
            disabled={readOnly}
            error={!!errors.discountKind}
            helperText={errors.discountKind?.message}
          />
          {form.discountKind !== "free" && (
            <Input
              size="medium"
              type="number"
              min={0}
              data-test-id="conditional-discount-value"
              label={intl.formatMessage(messages.value)}
              value={form.discountValue}
              onChange={e => update({ discountValue: e.target.value })}
              disabled={readOnly}
              error={!!errors.discountValue}
              helperText={errors.discountValue?.message}
              endAdornment={
                <Text size={3} color="default2">
                  {form.discountKind === "percentage" ? "%" : "kr."}
                </Text>
              }
            />
          )}
        </Box>

        <Box display="grid" gap={2}>
          <Text size={4} fontWeight="medium">
            <FormattedMessage {...messages.bannerTitle} />{" "}
            <Text size={3} color="default2" fontWeight="regular">
              <FormattedMessage {...messages.optional} />
            </Text>
          </Text>
          <Text size={2} color="default2">
            <FormattedMessage {...messages.bannerHint} />
          </Text>
          <BannerInput
            testId="conditional-label-is"
            label={intl.formatMessage(messages.labelIs)}
            value={form.labelIs}
            placeholder={autoIs ?? ""}
            disabled={readOnly}
            onChange={labelIs => update({ labelIs })}
          />
          <BannerInput
            testId="conditional-label-en"
            label={intl.formatMessage(messages.labelEn)}
            value={form.labelEn}
            placeholder={autoEn ?? ""}
            disabled={readOnly}
            onChange={labelEn => update({ labelEn })}
          />
          <Text size={2} color="default2" marginTop={2}>
            <FormattedMessage {...messages.preview} />
          </Text>
          <PreviewBanner>
            {previewIs ?? (
              <Text size={3} color="default2">
                <FormattedMessage {...messages.previewEmpty} />
              </Text>
            )}
          </PreviewBanner>
        </Box>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

interface BannerInputProps {
  testId: string;
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const BannerInput = ({
  testId,
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: BannerInputProps): JSX.Element => {
  const [focused, setFocused] = useState(false);

  return (
    <Box position="relative">
      <Input
        size="medium"
        data-test-id={testId}
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
      />
      {/* Macaw shows a placeholder only while the field is focused, and centres the label
          while it is empty. So when empty and not focused, the floated label and the
          automatic sentence (in grey) are drawn over the field instead. */}
      {!focused && value === "" && placeholder !== "" && (
        <Box
          data-test-id={`${testId}-auto`}
          position="absolute"
          pointerEvents="none"
          __inset="1px"
          backgroundColor={disabled ? "default2" : "default1"}
          borderRadius={3}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          paddingX={2}
          overflow="hidden"
        >
          <Text size={1} color="default2">
            {label}
          </Text>
          <Text
            size={4}
            color="default2"
            __whiteSpace="nowrap"
            __overflow="hidden"
            __textOverflow="ellipsis"
          >
            {placeholder}
          </Text>
        </Box>
      )}
    </Box>
  );
};

const PreviewBanner = ({ children }: { children: ReactNode }): JSX.Element => (
  <Box
    data-test-id="conditional-preview"
    backgroundColor="success1"
    borderColor="success1"
    borderStyle="solid"
    borderWidth={1}
    borderRadius={3}
    paddingX={4}
    paddingY={3}
  >
    <Text size={4} fontWeight="bold">
      {children}
    </Text>
  </Box>
);
