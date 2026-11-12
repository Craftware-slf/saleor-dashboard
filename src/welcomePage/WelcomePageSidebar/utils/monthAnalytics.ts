import { OrderStatus } from "@dashboard/graphql";

/**
 * Statuses Saleor's `ordersTotal` counts as sales: every non-draft order except cancelled and
 * expired ones (saleor/graphql/order/resolvers.py `resolve_orders_total`). Order counts, average
 * order value and the last-month comparison use the same set so the figures add up.
 */
export const COUNTED_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.UNCONFIRMED,
  OrderStatus.UNFULFILLED,
  OrderStatus.PARTIALLY_FULFILLED,
  OrderStatus.FULFILLED,
  OrderStatus.PARTIALLY_RETURNED,
  OrderStatus.RETURNED,
];

/** Orders that have been placed but not (fully) shipped yet. */
export const AWAITING_SHIPMENT_STATUSES: OrderStatus[] = [
  OrderStatus.UNFULFILLED,
  OrderStatus.PARTIALLY_FULFILLED,
];

interface MonthPeriods {
  /** Start of the current month, UTC — the same boundary `ordersTotal(period: THIS_MONTH)` uses. */
  monthStart: Date;
  /** Start of the previous month, UTC. */
  previousStart: Date;
  /**
   * The same point in the previous month: `previousStart` plus the time elapsed in this month,
   * capped at the end of the previous month (so 31 March compares with all of February).
   */
  previousEnd: Date;
}

export const getMonthPeriods = (now: Date): MonthPeriods => {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const elapsed = now.getTime() - monthStart.getTime();
  const previousEnd = new Date(
    Math.min(previousStart.getTime() + elapsed, monthStart.getTime() - 1),
  );

  return { monthStart, previousStart, previousEnd };
};

/** Relative change as a fraction (0.12 = +12 %), or null when there is nothing to compare with. */
export const getRelativeChange = (
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null => {
  if (current === null || current === undefined) {
    return null;
  }

  if (previous === null || previous === undefined || previous === 0) {
    return null;
  }

  return (current - previous) / previous;
};

export const getAverage = (total: number | null | undefined, count: number | null | undefined) => {
  if (total === null || total === undefined || !count) {
    return null;
  }

  return total / count;
};

export interface OrderLineForRanking {
  quantity: number;
  productName: string;
  productSku: string | null;
  variant: { id: string; product: { id: string; name: string } } | null;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
}

/**
 * Ranks products by units sold. Variants roll up into their product; lines without a variant
 * (deleted, or not visible to this staff member) fall back to the product name stored on the
 * order line — not the SKU, which would split one product into a row per variant.
 */
export const getTopProducts = (lines: OrderLineForRanking[], limit: number): TopProduct[] => {
  const byProduct = new Map<string, TopProduct>();

  for (const line of lines) {
    const id = line.variant?.product.id ?? `unlinked:${line.productName}`;
    const name = line.variant?.product.name ?? line.productName;
    const existing = byProduct.get(id);

    if (existing) {
      existing.quantity += line.quantity;
    } else {
      byProduct.set(id, { id, name, quantity: line.quantity });
    }
  }

  return [...byProduct.values()]
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    .slice(0, limit);
};
