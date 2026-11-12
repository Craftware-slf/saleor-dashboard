import { useApolloClient } from "@apollo/client";
import {
  WelcomePageOrdersInPeriodDocument,
  type WelcomePageOrdersInPeriodQuery,
  type WelcomePageOrdersInPeriodQueryVariables,
} from "@dashboard/graphql";
import { useEffect, useState } from "react";

import { COUNTED_ORDER_STATUSES, type OrderLineForRanking } from "../../utils/monthAnalytics";

/** 30 pages × 100 orders. Beyond this the totals are flagged as incomplete rather than fetched. */
const MAX_PAGES = 30;

interface OrdersInPeriodParams {
  channelId: string | undefined;
  from: string;
  to: string | null;
  withLines: boolean;
  skip: boolean;
}

interface OrdersInPeriodResult {
  loading: boolean;
  hasError: boolean;
  /** True when MAX_PAGES was hit — the sums below cover only part of the period. */
  truncated: boolean;
  orderCount: number;
  grossTotal: number;
  lines: OrderLineForRanking[];
}

const initialResult: OrdersInPeriodResult = {
  loading: true,
  hasError: false,
  truncated: false,
  orderCount: 0,
  grossTotal: 0,
  lines: [],
};

/**
 * Pages through a channel's orders in a date range and sums them client-side. Saleor's reporting
 * API only offers TODAY / THIS_MONTH totals, so anything else (last month, per-product units)
 * has to be added up from the orders themselves.
 */
export const useOrdersInPeriod = ({
  channelId,
  from,
  to,
  withLines,
  skip,
}: OrdersInPeriodParams): OrdersInPeriodResult => {
  const client = useApolloClient();
  const [result, setResult] = useState<OrdersInPeriodResult>(initialResult);

  useEffect(
    function fetchOrdersInPeriod() {
      if (skip || !channelId) {
        setResult({ ...initialResult, loading: false });

        return;
      }

      let cancelled = false;

      setResult(initialResult);

      const run = async () => {
        let after: string | null = null;
        let pages = 0;
        let hasNextPage = true;
        let orderCount = 0;
        let grossTotal = 0;
        const lines: OrderLineForRanking[] = [];

        while (hasNextPage && pages < MAX_PAGES) {
          const response: { data: WelcomePageOrdersInPeriodQuery } = await client.query<
            WelcomePageOrdersInPeriodQuery,
            WelcomePageOrdersInPeriodQueryVariables
          >({
            query: WelcomePageOrdersInPeriodDocument,
            fetchPolicy: "network-only",
            variables: {
              channelId,
              from,
              to,
              after,
              withLines,
              countedStatuses: COUNTED_ORDER_STATUSES,
            },
          });

          if (cancelled) {
            return;
          }

          const connection = response.data.orders;

          for (const edge of connection?.edges ?? []) {
            orderCount += 1;
            grossTotal += edge.node.total.gross.amount;
            lines.push(...(edge.node.lines ?? []));
          }

          pages += 1;
          hasNextPage = connection?.pageInfo.hasNextPage ?? false;
          after = connection?.pageInfo.endCursor ?? null;
        }

        setResult({
          loading: false,
          hasError: false,
          truncated: hasNextPage,
          orderCount,
          grossTotal,
          lines,
        });
      };

      run().catch(() => {
        if (!cancelled) {
          setResult({ ...initialResult, loading: false, hasError: true });
        }
      });

      return () => {
        cancelled = true;
      };
    },
    [client, channelId, from, to, withLines, skip],
  );

  return result;
};
