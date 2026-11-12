import Money from "@dashboard/components/Money";
import { orderListUrlWithChannelAndStatuses } from "@dashboard/orders/urls";
import { Box, Skeleton, Text } from "@saleor/macaw-ui-next";
import type * as React from "react";
import { useIntl } from "react-intl";

import { useWelcomePageSidebarContext } from "../../context/welcomePageSidebarContext";
import { welcomePageMessages } from "../../messages";
import { AWAITING_SHIPMENT_STATUSES, type TopProduct } from "../../utils/monthAnalytics";
import { WelcomePageAnalyticsCard } from "../WelcomePageAnalyticsCard";
import {
  useWelcomePageMonthAnalytics,
  type WelcomePageMonthAnalytics as MonthAnalytics,
} from "./useWelcomePageMonthAnalytics";

/** "▲ 12%" / "▼ 3%" — rendered only when there is a last-month figure to compare with. */
const ChangeBadge = ({ change }: { change: number | null }) => {
  const intl = useIntl();

  if (change === null || !Number.isFinite(change)) {
    return null;
  }

  const rounded = Math.round(change * 100);
  const arrow = rounded > 0 ? "▲" : rounded < 0 ? "▼" : "";
  const color = rounded > 0 ? "success1" : rounded < 0 ? "critical1" : "default2";

  return (
    <Text size={2} color={color} fontWeight="medium" whiteSpace="nowrap">
      {arrow} {intl.formatNumber(Math.abs(rounded))}%
    </Text>
  );
};

interface MetricRowProps {
  label: string;
  value: React.ReactNode;
  change: number | null;
  loading: boolean;
  testId: string;
}

const MetricRow = ({ label, value, change, loading, testId }: MetricRowProps) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="baseline"
    gap={3}
    data-test-id={testId}
  >
    <Text size={4}>{label}</Text>
    <Box display="flex" alignItems="baseline" gap={2}>
      {!loading && <ChangeBadge change={change} />}
      <Text size={4} fontWeight="bold" whiteSpace="nowrap">
        {loading ? <Skeleton width={10} height={3} /> : value}
      </Text>
    </Box>
  </Box>
);

interface SectionProps {
  analytics: MonthAnalytics;
  unavailable: boolean;
  loading: boolean;
}

const ThisMonthCard = ({ analytics, unavailable, loading }: SectionProps) => {
  const intl = useIntl();
  const isLoading = !unavailable && loading;
  const change = (value: number | null) => (unavailable ? null : value);
  const showComparison =
    !unavailable &&
    !loading &&
    [analytics.sales.change, analytics.orders.change, analytics.averageOrderValue.change].some(
      value => value !== null,
    );

  return (
    <Box
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
      borderRadius={3}
      paddingX={3}
      paddingY={5}
      display="flex"
      flexDirection="column"
      gap={3}
      data-test-id="month-analytics"
    >
      <Text size={5}>{intl.formatMessage(welcomePageMessages.thisMonthCardTitle)}</Text>
      <MetricRow
        testId="month-sales"
        label={intl.formatMessage(welcomePageMessages.thisMonthSales)}
        value={unavailable ? 0 : <Money money={analytics.sales.value} />}
        change={change(analytics.sales.change)}
        loading={isLoading}
      />
      <MetricRow
        testId="month-orders"
        label={intl.formatMessage(welcomePageMessages.thisMonthOrders)}
        value={intl.formatNumber(unavailable ? 0 : (analytics.orders.value ?? 0))}
        change={change(analytics.orders.change)}
        loading={isLoading}
      />
      <MetricRow
        testId="month-average-order-value"
        label={intl.formatMessage(welcomePageMessages.thisMonthAverageOrderValue)}
        value={
          !unavailable && analytics.averageOrderValue.value ? (
            <Money money={analytics.averageOrderValue.value} />
          ) : (
            "–"
          )
        }
        change={change(analytics.averageOrderValue.change)}
        loading={isLoading}
      />
      {showComparison && (
        <Text size={2} color="default2">
          {intl.formatMessage(welcomePageMessages.comparedWithLastMonth)}
        </Text>
      )}
    </Box>
  );
};

const AwaitingShipmentCard = ({ analytics, unavailable, loading }: SectionProps) => {
  const intl = useIntl();
  const { selectedChannel } = useWelcomePageSidebarContext();

  return (
    <WelcomePageAnalyticsCard
      title={intl.formatMessage(welcomePageMessages.awaitingShipmentCardTitle)}
      subtitle={intl.formatMessage(welcomePageMessages.awaitingShipmentSubtitle)}
      to={orderListUrlWithChannelAndStatuses(selectedChannel, AWAITING_SHIPMENT_STATUSES)}
      testId="awaiting-shipment-analytics"
    >
      {unavailable ? (
        0
      ) : !loading ? (
        intl.formatNumber(analytics.awaitingShipment ?? 0)
      ) : (
        <Skeleton width={16} height={3} />
      )}
    </WelcomePageAnalyticsCard>
  );
};

interface TopProductsProps {
  products: TopProduct[];
  loading: boolean;
  unavailable: boolean;
  truncatedAt: number | null;
}

const TopProductsList = ({ products, loading, unavailable, truncatedAt }: TopProductsProps) => {
  const intl = useIntl();

  return (
    <Box display="flex" flexDirection="column" gap={2} data-test-id="top-products">
      <Text size={5}>{intl.formatMessage(welcomePageMessages.topProductsTitle)}</Text>
      {loading && !unavailable ? (
        <Skeleton height={3} />
      ) : products.length === 0 ? (
        <Text size={3} color="default2">
          {intl.formatMessage(welcomePageMessages.topProductsEmpty)}
        </Text>
      ) : (
        <Box as="ol" display="flex" flexDirection="column" gap={1.5} margin={0} padding={0}>
          {products.map((product, index) => (
            <Box
              as="li"
              key={product.id}
              display="flex"
              justifyContent="space-between"
              gap={3}
              data-test-id="top-product"
            >
              <Text size={3} ellipsis title={product.name}>
                {index + 1}. {product.name}
              </Text>
              <Text size={3} color="default2" whiteSpace="nowrap">
                {intl.formatMessage(welcomePageMessages.topProductsUnits, {
                  quantity: intl.formatNumber(product.quantity),
                })}
              </Text>
            </Box>
          ))}
        </Box>
      )}
      {truncatedAt !== null && (
        <Text size={2} color="default2">
          {intl.formatMessage(welcomePageMessages.topProductsTruncated, {
            count: intl.formatNumber(truncatedAt),
          })}
        </Text>
      )}
    </Box>
  );
};

/**
 * Month-to-date block of the home sidebar: sales / orders / AOV with the change vs. last month,
 * orders awaiting shipment, and the month's best sellers. One hook call feeds all three, so the
 * order pages behind them are fetched once.
 */
export const WelcomePageMonthAnalytics = () => {
  const { hasNoChannels } = useWelcomePageSidebarContext();
  const { analytics, loading, hasError, topProductsLoading, topProductsTruncatedAt } =
    useWelcomePageMonthAnalytics();
  const unavailable = hasNoChannels || hasError;

  return (
    <>
      <ThisMonthCard analytics={analytics} unavailable={unavailable} loading={loading} />
      <AwaitingShipmentCard analytics={analytics} unavailable={unavailable} loading={loading} />
      <TopProductsList
        products={unavailable ? [] : analytics.topProducts}
        loading={topProductsLoading}
        unavailable={unavailable}
        truncatedAt={topProductsTruncatedAt}
      />
    </>
  );
};
