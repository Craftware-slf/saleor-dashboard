import { type StockAvailability } from "@dashboard/graphql";

import { BooleanValuesHandler, type Handler } from "../../API/Handler";
import { createStockAvailabilityOptions } from "../../constants";
import { type FilterElement } from "../../FilterElement";
import { type LeftOperand } from "../../LeftOperandsProvider";
import { QueryVarsBuilderUtils } from "../utils";
import { type BothApiQueryVarsBuilder } from "./types";

type StockAvailabilityQueryPart = { stockAvailability?: StockAvailability };

/**
 * Surfaces `stockAvailability` (IN_STOCK / OUT_OF_STOCK) on the product list.
 *
 * Not handled by StaticBooleanQueryVarsBuilder: that one only takes true/false fields, and this
 * is an enum. Both `ProductFilterInput` and `ProductWhereInput` accept the bare enum — no `eq`
 * wrapper — so the two update methods emit the same shape.
 *
 * Saleor REQUIRES a channel alongside this filter; a channel-less query throws "More than one
 * channel exists. Specify which channel to use." even for a staff token. The channel row is
 * forced by CONSTRAINTS.channel.dependsOn in constants.ts rather than here, because the
 * constraint has to apply while the user is still building the filter, before any query is run.
 *
 * Unrelated to `ProductFilterKeys.stock` in src/products/views/ProductList/filters.ts — that is
 * dead pre-ConditionalFilter plumbing which nothing ever constructs a FilterElement for.
 */
export class StockAvailabilityQueryVarsBuilder
  implements BothApiQueryVarsBuilder<StockAvailabilityQueryPart>
{
  canHandle(element: FilterElement): boolean {
    return element.value.value === "stockAvailability";
  }

  createOptionFetcher(): Handler {
    return new BooleanValuesHandler(createStockAvailabilityOptions() as LeftOperand[]);
  }

  updateWhereQueryVariables(
    query: Readonly<StockAvailabilityQueryPart>,
    element: FilterElement,
  ): StockAvailabilityQueryPart {
    const value = QueryVarsBuilderUtils.extractValueFromOption(element.condition.selected.value);

    if (!value) {
      return { ...query };
    }

    return { ...query, stockAvailability: value as StockAvailability };
  }

  updateFilterQueryVariables(
    query: Readonly<StockAvailabilityQueryPart>,
    element: FilterElement,
  ): StockAvailabilityQueryPart {
    return this.updateWhereQueryVariables(query, element);
  }
}
