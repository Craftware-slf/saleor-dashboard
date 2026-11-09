import { defineMessages } from "react-intl";

export const conditionalMessages = defineMessages({
  typeLabel: {
    defaultMessage: "Conditional",
    id: "aF6rhn",
    description: "discount type: a cart condition evaluated by the storefront",
  },
  title: {
    defaultMessage: "Conditional discount",
    id: "p4nW6A",
    description: "card title",
  },
  subtitle: {
    defaultMessage:
      "Applied in the cart by the storefront when the condition is met. Saleor rules are not used for this type.",
    id: "F3TXyu",
    description: "card subtitle",
  },
  channels: {
    defaultMessage: "Channels",
    id: "INKNve",
    description: "conditional discount channels field",
  },
  appliesTo: {
    defaultMessage: "Applies to",
    id: "pmUT9L",
    description: "conditional discount items section",
  },
  appliesToHint: {
    defaultMessage:
      "A product counts when it matches any of the selected products, categories, collections or brands.",
    id: "gs/l0/",
    description: "conditional discount items hint",
  },
  products: {
    defaultMessage: "Products",
    id: "qK5kO/",
    description: "conditional discount products picker",
  },
  categories: {
    defaultMessage: "Categories",
    id: "OKwzXZ",
    description: "conditional discount categories picker",
  },
  collections: {
    defaultMessage: "Collections",
    id: "GpFCu+",
    description: "conditional discount collections picker",
  },
  brands: {
    defaultMessage: "Brands",
    id: "hzcwaR",
    description: "conditional discount brands picker",
  },
  variantsKept: {
    defaultMessage:
      "{count, plural, one {# variant} other {# variants}} selected outside the dashboard will be kept.",
    id: "Bl+J5P",
    description: "conditional discount: variant ids preserved from stored rule",
  },
  sameProduct: {
    defaultMessage: "Same product only",
    id: "xTFSAU",
    description: "conditional discount same-product switch",
  },
  sameProductOnHint: {
    defaultMessage: "The units must all be the same product, e.g. 4 of the same ball.",
    id: "JBXjU6",
    description: "conditional discount same-product switch on",
  },
  sameProductOffHint: {
    defaultMessage: "Any mix of the selected items counts.",
    id: "JCmqnB",
    description: "conditional discount same-product switch off",
  },
  quantityRule: {
    defaultMessage: "Quantity rule",
    id: "SUmaj7",
    description: "conditional discount quantity rule select",
  },
  modeEvery: {
    defaultMessage: "Every N units",
    id: "oX0a5d",
    description: "conditional discount quantity rule option",
  },
  modeTiers: {
    defaultMessage: "Quantity list (e.g. 8, 12, 16)",
    id: "HHrJ5a",
    description: "conditional discount quantity rule option",
  },
  modeBuyGet: {
    defaultMessage: "Buy N, get M",
    id: "yH/8bV",
    description: "conditional discount quantity rule option",
  },
  everyN: {
    defaultMessage: "N (units per group)",
    id: "JHyduK",
    description: "conditional discount every-N input",
  },
  onceOnly: {
    defaultMessage: "Once per cart only",
    id: "6D1r0W",
    description: "conditional discount: reward only the first group",
  },
  tiers: {
    defaultMessage: "Quantities",
    id: "D3xIKf",
    description: "conditional discount tier list input",
  },
  tiersHint: {
    defaultMessage: "Comma-separated. The discount covers the biggest quantity the cart reaches.",
    id: "Zva3Yw",
    description: "conditional discount tier list hint",
  },
  buyN: {
    defaultMessage: "Buy (N)",
    id: "dxNhg2",
    description: "conditional discount buy-N input",
  },
  getM: {
    defaultMessage: "Get (M)",
    id: "H6AuyB",
    description: "conditional discount get-M input",
  },
  repeat: {
    defaultMessage: "Repeat for every full group",
    id: "eFIX88",
    description: "conditional discount buy-N-get-M repeat checkbox",
  },
  discount: {
    defaultMessage: "Discount",
    id: "0X6qUG",
    description: "conditional discount reward kind select",
  },
  kindPercentage: {
    defaultMessage: "Percentage",
    id: "/LIM2s",
    description: "conditional discount reward kind",
  },
  kindFixed: {
    defaultMessage: "Fixed amount (kr. per unit)",
    id: "GgW/NI",
    description: "conditional discount reward kind",
  },
  kindFree: {
    defaultMessage: "Free",
    id: "3Oq+gO",
    description: "conditional discount reward kind",
  },
  value: {
    defaultMessage: "Value",
    id: "sEmh/T",
    description: "conditional discount reward value input",
  },
  bannerTitle: {
    defaultMessage: "Banner text",
    id: "K31+Hx",
    description: "conditional discount banner section title",
  },
  optional: {
    defaultMessage: "(optional)",
    id: "wnYCiq",
    description: "marks an optional section",
  },
  bannerHint: {
    defaultMessage:
      "Shown on the product page and the cart line. Leave empty to use the automatic text shown in grey.",
    id: "1I5n03",
    description: "conditional discount banner hint",
  },
  labelIs: {
    defaultMessage: "Icelandic",
    id: "+pEhUg",
    description: "conditional discount banner text input",
  },
  labelEn: {
    defaultMessage: "English",
    id: "0odMGx",
    description: "conditional discount banner text input",
  },
  preview: {
    defaultMessage: "Preview (is)",
    id: "8nbrAR",
    description: "conditional discount banner preview",
  },
  previewEmpty: {
    defaultMessage: "Complete the form to see the banner.",
    id: "kKXgtm",
    description: "conditional discount banner preview placeholder",
  },
  unsupportedTitle: {
    defaultMessage: "This rule can only be edited outside the dashboard",
    id: "Q8tfS+",
    description: "conditional discount read-only notice title",
  },
  unsupportedQuantityAll: {
    defaultMessage:
      "It discounts every unit once the condition is met, which this form does not offer. It is shown read-only and saving keeps it unchanged.",
    id: "VyrczI",
    description: "conditional discount read-only notice",
  },
  unsupportedCrossSell: {
    defaultMessage:
      "Its reward goes to other products (cross-sell), which this form does not offer. It is shown read-only and saving keeps it unchanged.",
    id: "kmLzLR",
    description: "conditional discount read-only notice",
  },
  unsupportedUnreadable: {
    defaultMessage:
      "Its stored rule is not valid JSON. It is shown read-only and saving keeps it unchanged.",
    id: "Kz/56/",
    description: "conditional discount read-only notice",
  },
  errorChannels: {
    defaultMessage: "Pick at least one channel",
    id: "k4c1F2",
    description: "conditional discount validation",
  },
  errorItems: {
    defaultMessage: "Pick at least one product, category or collection",
    id: "YlXzCC",
    description: "conditional discount validation",
  },
  errorPositiveInt: {
    defaultMessage: "Enter a whole number of 1 or more",
    id: "JvR+YF",
    description: "conditional discount validation",
  },
  errorTiers: {
    defaultMessage: "Enter whole numbers of 1 or more, separated by commas",
    id: "N9f7ih",
    description: "conditional discount validation",
  },
  errorPercentage: {
    defaultMessage: "Enter a percentage above 0 and at most 100",
    id: "HZBS7E",
    description: "conditional discount validation",
  },
  errorFixed: {
    defaultMessage: "Enter a whole number of krónur above 0",
    id: "0b3ly7",
    description: "conditional discount validation",
  },
  errorFree: {
    defaultMessage: "Free is only available with Buy N, get M",
    id: "/6XZVW",
    description: "conditional discount validation",
  },
  saveFailed: {
    defaultMessage: "Could not save the conditional discount rule",
    id: "7SR0yF",
    description: "conditional discount metadata write failed",
  },
});
