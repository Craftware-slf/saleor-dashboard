import { useUserPermissions } from "@dashboard/auth/hooks/useUserPermissions";
import { channelsList } from "@dashboard/channels/fixtures";
import { type ChannelFragment, PermissionEnum } from "@dashboard/graphql";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { activities } from "../fixtures";
import { WelcomePageSidebar } from "./WelcomePageSidebar";

jest.mock("@dashboard/auth/hooks/useUserPermissions");
jest.mock("./components/WelcomePageActivities/useWelcomePageActivities", () => ({
  useWelcomePageActivities: jest.fn(() => ({ activities, loading: false })),
}));
jest.mock("./components/WelcomePageSalesAnalytics/useWelcomePageSalesAnalytics", () => ({
  useWelcomePageSalesAnalytics: jest.fn(() => ({
    analytics: {
      sales: {
        amount: 1000,
        currency: "USD",
      },
    },
    loading: false,
  })),
}));
jest.mock("./components/WelcomePageStocksAnalytics/useWelcomePageStocksAnalytics", () => ({
  useWelcomePageStocksAnalytics: jest.fn(() => ({
    analytics: {
      productsOutOfStock: 10,
    },
    loading: false,
  })),
}));

jest.mock("./components/WelcomePageMonthAnalytics/useWelcomePageMonthAnalytics", () => ({
  useWelcomePageMonthAnalytics: jest.fn(() => ({
    analytics: {
      sales: { value: { amount: 250000, currency: "USD" }, change: 0.25 },
      orders: { value: 20, change: -0.1 },
      averageOrderValue: { value: { amount: 12500, currency: "USD" }, change: null },
      awaitingShipment: 3,
      topProducts: [
        { id: "p1", name: "Golf ball", quantity: 12 },
        { id: "p2", name: "Glove", quantity: 4 },
      ],
    },
    loading: false,
    hasError: false,
    topProductsLoading: false,
    topProductsTruncatedAt: null,
  })),
}));

jest.mock("@dashboard/hooks/useNotifier", () => ({
  useNotifier: jest.fn(() => () => undefined),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("WelcomePageSidebar", () => {
  it("should render chanel select, analytics and activities when user has permission to manage orders ", async () => {
    // Arrange
    (useUserPermissions as jest.Mock).mockReturnValue([{ code: PermissionEnum.MANAGE_ORDERS }]);

    const channel = channelsList[0] as ChannelFragment;
    const setChannel = jest.fn();

    render(
      <WelcomePageSidebar
        channel={channel}
        setChannel={setChannel}
        channels={channelsList}
        hasPermissionToManageOrders={true}
      />,
      { wrapper: MemoryRouter },
    );

    // Assert
    expect(screen.getByTestId("app-channel-select")).toBeInTheDocument();

    // Check sales analytics
    expect(screen.getByTestId("sales-analytics")).toHaveTextContent("1,000.00");
    expect(screen.getByTestId("sales-analytics")).toHaveTextContent("USD");

    // Check out-of-stock analytics
    expect(screen.getByTestId("out-of-stock-analytics")).toHaveTextContent("10");

    // Check month-to-date analytics
    expect(screen.getByTestId("month-sales")).toHaveTextContent("250,000.00");
    expect(screen.getByTestId("month-sales")).toHaveTextContent("▲ 25%");
    expect(screen.getByTestId("month-orders")).toHaveTextContent("20");
    expect(screen.getByTestId("month-orders")).toHaveTextContent("▼ 10%");
    expect(screen.getByTestId("month-average-order-value")).toHaveTextContent("12,500.00");
    expect(screen.getByTestId("month-average-order-value")).not.toHaveTextContent("%");
    expect(screen.getByTestId("awaiting-shipment-analytics")).toHaveTextContent("3");
    expect(screen.getByTestId("awaiting-shipment-analytics").closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("UNFULFILLED"),
    );
    expect(screen.getAllByTestId("top-product")).toHaveLength(2);
    expect(screen.getAllByTestId("top-product")[0]).toHaveTextContent("1. Golf ball");
    // The test intl mock leaves ICU placeholders un-interpolated ("{quantity} sold").
    expect(screen.getAllByTestId("top-product")[1]).toHaveTextContent("2. Glove");

    // Check activities
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
    expect(
      screen.getByText("Order #{orderId} was placed from draft by {userEmail}"),
    ).toBeInTheDocument();
    expect(screen.getByText("Order #{orderId} was fully paid")).toBeInTheDocument();
  });

  it("should render only channel select when user has no permission to manage orders ", async () => {
    // Arrange
    (useUserPermissions as jest.Mock).mockReturnValue([]);

    const channel = channelsList[0] as ChannelFragment;
    const setChannel = jest.fn();

    render(
      <WelcomePageSidebar
        channel={channel}
        setChannel={setChannel}
        channels={channelsList}
        hasPermissionToManageOrders={false}
      />,
      { wrapper: MemoryRouter },
    );

    // Assert
    expect(screen.getByTestId("app-channel-select")).toBeInTheDocument();
    expect(screen.queryByTestId("sales-analytics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("out-of-stock-analytics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("month-analytics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("awaiting-shipment-analytics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("top-products")).not.toBeInTheDocument();
    expect(screen.queryByTestId("activity-card")).not.toBeInTheDocument();
  });

  it("should allow to change channel", async () => {
    // Arrange
    const channel = channelsList[0] as ChannelFragment;
    const setChannel = jest.fn();

    render(
      <WelcomePageSidebar
        channel={channel}
        setChannel={setChannel}
        channels={channelsList}
        hasPermissionToManageOrders={true}
      />,
      { wrapper: MemoryRouter },
    );

    // Act

    await act(async () => {
      await userEvent.click(screen.getByRole("combobox"));
    });

    await act(async () => {
      await userEvent.click(screen.getAllByTestId("select-option")[1]);
    });

    // Assert
    expect(setChannel).toHaveBeenCalledWith(channelsList[1].id);
  });
});
