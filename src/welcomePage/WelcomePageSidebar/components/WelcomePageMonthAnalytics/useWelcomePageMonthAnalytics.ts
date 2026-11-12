import { roundMoneyAmount } from "@dashboard/components/Money";
import { useWelcomePageMonthAnalyticsQuery } from "@dashboard/graphql";
import { type IMoney } from "@dashboard/utils/intl";
import { useMemo, useState } from "react";

import { useWelcomePageSidebarContext } from "../../context/welcomePageSidebarContext";
import {
  AWAITING_SHIPMENT_STATUSES,
  COUNTED_ORDER_STATUSES,
  getAverage,
  getMonthPeriods,
  getRelativeChange,
  getTopProducts,
  type TopProduct,
} from "../../utils/monthAnalytics";
import { useOrdersInPeriod } from "./useOrdersInPeriod";

const TOP_PRODUCTS_LIMIT = 5;

export interface MonthMetric<T> {
  value: T | null;
  /** Fraction vs the same point last month (0.12 = +12 %); null when not comparable. */
  change: number | null;
}

export interface WelcomePageMonthAnalytics {
  sales: MonthMetric<IMoney>;
  orders: MonthMetric<number>;
  averageOrderValue: MonthMetric<IMoney>;
  awaitingShipment: number | null;
  topProducts: TopProduct[];
}

export const useWelcomePageMonthAnalytics = () => {
  const { selectedChannel, hasNoChannels, hasPermissionToManageOrders } =
    useWelcomePageSidebarContext();
  // Fixed for the lifetime of the page so the queries below keep stable variables.
  const [periods] = useState(() => getMonthPeriods(new Date()));
  const skip = hasNoChannels || !selectedChannel || !hasPermissionToManageOrders;
  const monthStart = periods.monthStart.toISOString();

  const { data, loading, error } = useWelcomePageMonthAnalyticsQuery({
    skip,
    fetchPolicy: "cache-and-network",
    variables: {
      channel: selectedChannel?.slug ?? "",
      channelId: selectedChannel?.id ?? "",
      monthStart,
      countedStatuses: COUNTED_ORDER_STATUSES,
      awaitingShipmentStatuses: AWAITING_SHIPMENT_STATUSES,
    },
  });

  const thisMonth = useOrdersInPeriod({
    channelId: selectedChannel?.id,
    from: monthStart,
    to: null,
    withLines: true,
    skip,
  });

  const previousMonth = useOrdersInPeriod({
    channelId: selectedChannel?.id,
    from: periods.previousStart.toISOString(),
    to: periods.previousEnd.toISOString(),
    withLines: false,
    skip,
  });

  const analytics = useMemo<WelcomePageMonthAnalytics>(() => {
    const sales = data?.salesThisMonth?.gross ?? null;
    const orderCount = data?.ordersThisMonth?.totalCount ?? null;
    const currency = sales?.currency ?? selectedChannel?.currencyCode ?? "";
    const average = getAverage(sales?.amount, orderCount);
    const comparable =
      !previousMonth.loading && !previousMonth.hasError && !previousMonth.truncated;
    const previousAverage = getAverage(previousMonth.grossTotal, previousMonth.orderCount);

    return {
      sales: {
        value: sales,
        change: comparable ? getRelativeChange(sales?.amount, previousMonth.grossTotal) : null,
      },
      orders: {
        value: orderCount,
        change: comparable ? getRelativeChange(orderCount, previousMonth.orderCount) : null,
      },
      averageOrderValue: {
        value: average === null ? null : { amount: roundMoneyAmount(average, currency), currency },
        change: comparable ? getRelativeChange(average, previousAverage) : null,
      },
      awaitingShipment: data?.awaitingShipment?.totalCount ?? null,
      topProducts:
        thisMonth.hasError || thisMonth.loading
          ? []
          : getTopProducts(thisMonth.lines, TOP_PRODUCTS_LIMIT),
    };
  }, [data, previousMonth, thisMonth, selectedChannel?.currencyCode]);

  return {
    analytics,
    loading: loading && !data,
    topProductsLoading: thisMonth.loading,
    /** Order count the best sellers were computed from, when the order list was cut short. */
    topProductsTruncatedAt: thisMonth.truncated ? thisMonth.orderCount : null,
    hasError: !!error,
  };
};
