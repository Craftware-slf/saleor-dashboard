import { Box, Text } from "@saleor/macaw-ui-next";
import type * as React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

interface WelcomePageAnalyticsCardProps {
  testId?: string;
  title: string;
  /** Defaults to "Today". */
  subtitle?: string;
  /** When set, the whole card links here (e.g. a filtered order list). */
  to?: string;
  children?: React.ReactNode;
}

export const WelcomePageAnalyticsCard = ({
  children,
  title,
  subtitle,
  to,
  testId,
}: WelcomePageAnalyticsCardProps) => {
  const card = (
    <Box
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
      borderRadius={3}
      paddingX={3}
      paddingY={5}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      gap={3}
      backgroundColor={to ? { default: "default1", hover: "default1Hovered" } : undefined}
      data-test-id={testId}
    >
      <Box display="flex" flexDirection="column" gap={0.5}>
        <Text size={5}>{title}</Text>
        <Text size={2} color="default1">
          {subtitle ?? <FormattedMessage id="zWgbGg" defaultMessage="Today" />}
        </Text>
      </Box>
      <Text as="h4" size={5} fontWeight="bold">
        {children}
      </Text>
    </Box>
  );

  if (!to) {
    return card;
  }

  return (
    <Link to={to} style={{ color: "inherit", textDecoration: "none" }}>
      {card}
    </Link>
  );
};
