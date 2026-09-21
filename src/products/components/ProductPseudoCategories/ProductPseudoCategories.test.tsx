import { ThemeProvider } from "@saleor/macaw-ui-next";
import { render, screen } from "@testing-library/react";
import { IntlProvider } from "react-intl";

import {
  ProductPseudoCategories,
  type ProductPseudoCategoriesProps,
} from "./ProductPseudoCategories";

// macaw's DynamicCombobox uses an infinite-scroll hook built on IntersectionObserver, which
// jsdom does not implement. Nothing here tests scrolling, so a no-op stub is enough.
beforeAll(() => {
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return [];
    }
  };
});

const HJOL = { id: "Q2hhbm5lbDox", slug: "hjol", name: "Örninn Hjól" };
const GOLF = { id: "Q2hhbm5lbDoy", slug: "golf", name: "Örninn Golf" };

const defaultProps: ProductPseudoCategoriesProps = {
  channels: [HJOL, GOLF],
  value: {},
  categories: [
    { value: "golf-ferdacover", label: "Ferðacover" },
    { value: "hjol-bunadur-allskonar", label: "Búnaður allskonar" },
  ],
  disabled: false,
  fetchCategories: jest.fn(),
  fetchMoreCategories: { hasMore: false, loading: false, onFetchMore: jest.fn() },
  onChange: jest.fn(),
};

const renderCard = (props: Partial<ProductPseudoCategoriesProps> = {}) =>
  render(
    <ThemeProvider>
      <IntlProvider locale="en">
        <ProductPseudoCategories {...defaultProps} {...props} />
      </IntlProvider>
    </ThemeProvider>,
  );

describe("ProductPseudoCategories", () => {
  it("renders one picker per channel the product is listed in", () => {
    renderCard();

    expect(screen.getByTestId("pseudo-category-hjol")).toBeInTheDocument();
    expect(screen.getByTestId("pseudo-category-golf")).toBeInTheDocument();
  });

  // ~7,500 of Örninn's products are sold in exactly one store. An always-visible card offering a
  // per-store override would be noise on every one of them, and would invite someone to set an
  // override that has no second store to apply to.
  it("renders nothing for a single-store product", () => {
    renderCard({ channels: [HJOL] });

    expect(screen.queryByTestId("product-pseudo-categories")).not.toBeInTheDocument();
  });

  it("renders nothing when the product is listed in no channel at all", () => {
    renderCard({ channels: [] });

    expect(screen.queryByTestId("product-pseudo-categories")).not.toBeInTheDocument();
  });

  it("labels each picker with the store name, so it is obvious which store is being set", () => {
    renderCard();

    expect(screen.getByText("Örninn Hjól")).toBeInTheDocument();
    expect(screen.getByText("Örninn Golf")).toBeInTheDocument();
  });

  // THE REGRESSION THIS FEATURE EXISTS FOR: without a per-store category the product falls back
  // to its canonical one, so it appears on NO category page in the second store. The saved value
  // must therefore survive a render — a picker that silently forgets it is the failure mode.
  it("shows the already-saved category for a store", () => {
    renderCard({ value: { golf: "golf-ferdacover" } });

    expect(screen.getByDisplayValue("Ferðacover")).toBeInTheDocument();
  });

  it("falls back to showing the raw slug when the option list has not loaded it yet", () => {
    // Options arrive from a paginated search, so a saved slug is routinely not in the first page.
    // Showing the slug is honest; showing an empty box would read as "no category set".
    renderCard({ value: { golf: "golf-not-in-options" }, categories: [] });

    expect(screen.getByDisplayValue("golf-not-in-options")).toBeInTheDocument();
  });
});
