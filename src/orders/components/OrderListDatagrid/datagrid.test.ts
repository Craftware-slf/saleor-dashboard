import { type PillCell } from "@dashboard/components/Datagrid/customCells/PillCell";
import { type GetCellContentOpts } from "@dashboard/components/Datagrid/Datagrid";
import { type AvailableColumn } from "@dashboard/components/Datagrid/types";
import {
  type OrderChargeStatusEnum,
  type OrderListQuery,
  type OrderStatus,
  type PaymentChargeStatusEnum,
} from "@dashboard/graphql";
import { getStatusColor } from "@dashboard/misc";
import { type RelayToFlat } from "@dashboard/types";
import { type TextCell } from "@glideapps/glide-data-grid";
import { testIntlInstance } from "@test/intl";
import { renderHook } from "@testing-library/react";
import { type IntlShape } from "react-intl";

import {
  getCustomerCellContent,
  getPaymentCellContent,
  getShippingMethodCellContent,
  useGetCellContent,
} from "./datagrid";

jest.mock("@saleor/macaw-ui-next", () => ({
  useTheme: () => ({ theme: "defaultLight" }),
}));

describe("getCustomerCellContent", () => {
  it("should return billing address first name and last name when exists", () => {
    // Arrange
    const data = {
      billingAddress: {
        firstName: "John",
        lastName: "Doe",
      },
    } as RelayToFlat<NonNullable<OrderListQuery["orders"]>>[number];
    // Act
    const result = getCustomerCellContent(data);

    // Assert
    expect(result.data).toEqual("John Doe");
    expect(result.displayData).toEqual("John Doe");
  });
  it("should return user email when exists", () => {
    // Arrange
    const data = {
      billingAddress: {
        city: "New York",
      },
      userEmail: "john@doe.com",
    } as RelayToFlat<NonNullable<OrderListQuery["orders"]>>[number];
    // Act
    const result = getCustomerCellContent(data);

    // Assert
    expect(result.data).toEqual("john@doe.com");
    expect(result.displayData).toEqual("john@doe.com");
  });
  it("should return - when no user email and billing address", () => {
    // Arrange
    const data = {} as RelayToFlat<NonNullable<OrderListQuery["orders"]>>[number];
    // Act
    const result = getCustomerCellContent(data);

    // Assert
    expect(result.data).toEqual("-");
    expect(result.displayData).toEqual("-");
  });
  it("should return - when no data", () => {
    // Arrange & Act
    const result = getCustomerCellContent(undefined);

    // Assert
    expect(result.data).toEqual("-");
    expect(result.displayData).toEqual("-");
  });
});

describe("useGetCellContent", () => {
  // Arrange
  const mockColumns: AvailableColumn[] = [
    { id: "number", title: "Number", width: 100 },
    { id: "date", title: "Date", width: 100 },
    { id: "customer", title: "Customer", width: 100 },
    { id: "payment", title: "Payment", width: 100 },
    { id: "status", title: "Status", width: 100 },
    { id: "total", title: "Total", width: 100 },
  ];

  const mockOrders = [
    {
      __typename: "Order",
      id: "order-1",
      number: "1",
      created: "2023-01-01T00:00:00Z",
      userEmail: "john@example.com",
      paymentStatus: "PAID" as PaymentChargeStatusEnum,
      status: "FULFILLED" as OrderStatus,
      billingAddress: null,
      total: { gross: { amount: 100, currency: "USD" } },
    },
  ] as RelayToFlat<NonNullable<OrderListQuery["orders"]>>;

  it("should return correct cell content for each column", () => {
    // Arrange
    const { result } = renderHook(() =>
      useGetCellContent({ columns: mockColumns, orders: mockOrders }),
    );
    const getCellContent = result.current;
    const contentOpts = { added: [], removed: [] } as unknown as GetCellContentOpts;

    // Act & Assert
    expect(getCellContent([0, 0], contentOpts)).toEqual({
      allowOverlay: false,
      cursor: "pointer",
      data: "1",
      displayData: "1",
      kind: "text",
      readonly: true,
      style: "normal",
    });
    expect(getCellContent([1, 0], contentOpts)).toEqual({
      allowOverlay: true,
      copyData: "2023-01-01T00:00:00Z",
      cursor: "pointer",
      data: {
        kind: "date-cell",
        value: "2023-01-01T00:00:00Z",
      },
      kind: "custom",
      readonly: false,
    });
    expect(getCellContent([2, 0], contentOpts)).toEqual({
      allowOverlay: false,
      cursor: "pointer",
      data: "john@example.com",
      displayData: "john@example.com",
      kind: "text",
      readonly: true,
      style: "normal",
    });
    expect(getCellContent([3, 0], contentOpts)).toEqual({
      allowOverlay: true,
      copyData: "PAID",
      cursor: "pointer",
      data: {
        color: getStatusColor({ status: "error", currentTheme: "defaultLight" }),
        kind: "auto-tags-cell",
        value: "PAID",
      },
      kind: "custom",
      readonly: false,
    });
    expect(getCellContent([4, 0], contentOpts)).toEqual({
      allowOverlay: true,
      copyData: "Fulfilled",
      cursor: "pointer",
      data: {
        color: getStatusColor({ status: "success", currentTheme: "defaultLight" }),
        kind: "auto-tags-cell",
        value: "Fulfilled",
      },
      kind: "custom",
      readonly: false,
    });
    expect(getCellContent([5, 0], contentOpts)).toEqual({
      allowOverlay: true,
      copyData: "100",
      cursor: "pointer",
      data: { currency: "USD", kind: "money-cell", value: 100 },
      kind: "custom",
      readonly: false,
    });
  });

  it("should return empty cell for invalid column", () => {
    // Arrange
    const { result } = renderHook(() =>
      useGetCellContent({ columns: mockColumns, orders: mockOrders }),
    );
    const getCellContent = result.current;
    const contentOpts = { added: [], removed: [] } as unknown as GetCellContentOpts;

    // Act & Assert
    expect((getCellContent([10, 0], contentOpts) as TextCell).data).toBe("");
  });

  it("should return empty cell for removed row", () => {
    const { result } = renderHook(() =>
      useGetCellContent({ columns: mockColumns, orders: mockOrders }),
    );
    const getCellContent = result.current;
    const contentOpts = { added: [1], removed: [] } as unknown as GetCellContentOpts;

    // Act & Assert
    expect((getCellContent([0, 1], contentOpts) as TextCell).data).toBe("");
  });
});

type RowDataType = RelayToFlat<NonNullable<OrderListQuery["orders"]>>[number];

describe("getPaymentCellContent", () => {
  it("should return Fully Paid when payment status is PAID", () => {
    // Arrange
    const data = {
      paymentStatus: "PAID" as PaymentChargeStatusEnum,
    } as RowDataType;

    // Act
    const result = getPaymentCellContent(testIntlInstance, "defaultLight", data);

    // Assert
    expect((result.data as PillCell["data"]).value).toEqual("PAID");
  });

  it("should return Overcharged when charge status is OVERCHARGED", () => {
    // Arrange
    const data = {
      chargeStatus: "OVERCHARGED" as OrderChargeStatusEnum,
    } as RowDataType;

    // Act
    const result = getPaymentCellContent(testIntlInstance, "defaultLight", data);

    // Assert
    expect((result.data as PillCell["data"]).value).toEqual("Overcharged");
  });
});

describe("kennitala column", () => {
  const columns: AvailableColumn[] = [{ id: "kennitala", title: "Kennitala", width: 150 }];

  const orderWith = (privateMetadata: Array<{ key: string; value: string }>) =>
    [
      {
        __typename: "Order",
        id: "order-1",
        number: "41",
        privateMetadata: privateMetadata.map(entry => ({
          __typename: "MetadataItem",
          ...entry,
        })),
      },
    ] as RelayToFlat<NonNullable<OrderListQuery["orders"]>>;

  const cellFor = (privateMetadata: Array<{ key: string; value: string }>) => {
    const { result } = renderHook(() =>
      useGetCellContent({ columns, orders: orderWith(privateMetadata) }),
    );

    return result.current([0, 0], {
      added: [],
      removed: [],
    } as unknown as GetCellContentOpts) as TextCell;
  };

  it("renders the kennitala hyphenated", () => {
    // Act
    const cell = cellFor([{ key: "kennitala", value: "0101902079" }]);

    // Assert
    expect(cell.displayData).toEqual("010190-2079");
  });

  it("renders a dash when the order predates capture", () => {
    // Act
    const cell = cellFor([]);

    // Assert — a dash, not a blank, so the column does not read as "still loading"
    expect(cell.displayData).toEqual("-");
  });

  it("ignores other private metadata keys", () => {
    // Act
    const cell = cellFor([{ key: "external_app_shipping_id", value: "abc123" }]);

    // Assert
    expect(cell.displayData).toEqual("-");
  });

  it("is readonly — the grid offers no way to edit a kennitala", () => {
    // Act
    const cell = cellFor([{ key: "kennitala", value: "0101902079" }]);

    // Assert
    expect(cell.readonly).toBe(true);
  });
});

describe("shipping method column", () => {
  const columns: AvailableColumn[] = [
    { id: "shippingMethod", title: "Shipping method", width: 250 },
  ];

  const cellFor = (order: Record<string, unknown>) => {
    const orders = [
      { __typename: "Order", id: "order-1", number: "23", metadata: [], ...order },
    ] as unknown as RelayToFlat<NonNullable<OrderListQuery["orders"]>>;
    const { result } = renderHook(() => useGetCellContent({ columns, orders }));

    return result.current([0, 0], {
      added: [],
      removed: [],
    } as unknown as GetCellContentOpts) as TextCell;
  };

  it("renders the method name", () => {
    // Act
    const cell = cellFor({
      shippingMethodName: "Pósturinn",
      deliveryMethod: { __typename: "ShippingMethod", id: "sm-1", name: "Pósturinn" },
    });

    // Assert
    expect(cell.displayData).toEqual("Pósturinn");
    expect(cell.readonly).toBe(true);
  });

  it("appends the Dropp pickup point the storefront stamps", () => {
    // Act
    const cell = cellFor({
      shippingMethodName: "Dropp.is",
      deliveryMethod: { __typename: "ShippingMethod", id: "sm-2", name: "Dropp.is" },
      metadata: [
        { __typename: "MetadataItem", key: "dropp_pickup_point_name", value: "Orkan Dalvegi" },
        {
          __typename: "MetadataItem",
          key: "dropp_pickup_point_address",
          value: "Dalvegur 20, 201 Kópavogur",
        },
      ],
    });

    // Assert
    expect(cell.displayData).toEqual("Dropp.is · Orkan Dalvegi, Dalvegur 20, 201 Kópavogur");
  });

  it("names the warehouse for native click & collect", () => {
    // Arrange — the react-intl jest mock does not interpolate, so interpolate here
    const intl = {
      formatMessage: (message: { defaultMessage: string }, values: Record<string, string>) =>
        message.defaultMessage.replace("{warehouseName}", values.warehouseName),
    } as unknown as IntlShape;
    const order = {
      shippingMethodName: null,
      deliveryMethod: { __typename: "Warehouse", id: "wh-1", name: "Örninn Faxafen" },
    } as unknown as RelayToFlat<NonNullable<OrderListQuery["orders"]>>[number];

    // Act
    const cell = getShippingMethodCellContent(intl, order);

    // Assert
    expect(cell.displayData).toEqual("Pickup: Örninn Faxafen");
  });

  it("renders a dash when the order has no delivery method", () => {
    // Act
    const cell = cellFor({ shippingMethodName: null, deliveryMethod: null });

    // Assert
    expect(cell.displayData).toEqual("-");
  });
});

describe("payment method column", () => {
  const columns: AvailableColumn[] = [{ id: "paymentMethod", title: "Payment method", width: 180 }];

  const cellFor = (metadata: Array<{ key: string; value: string }>) => {
    const orders = [
      {
        __typename: "Order",
        id: "order-1",
        number: "41",
        metadata: metadata.map(entry => ({ __typename: "MetadataItem", ...entry })),
      },
    ] as RelayToFlat<NonNullable<OrderListQuery["orders"]>>;
    const { result } = renderHook(() => useGetCellContent({ columns, orders }));

    return result.current([0, 0], {
      added: [],
      removed: [],
    } as unknown as GetCellContentOpts) as TextCell;
  };

  it.each([
    ["krafa", "Krafa (on account)"],
    ["teya", "Card (Teya)"],
    ["netgiro", "Netgíró"],
  ])("names %s for staff", (value, label) => {
    // Act
    const cell = cellFor([{ key: "payment_method", value }]);

    // Assert
    expect(cell.displayData).toEqual(label);
  });

  it("shows an unrecognised method raw rather than hiding it", () => {
    // Act
    const cell = cellFor([{ key: "payment_method", value: "pei" }]);

    // Assert
    expect(cell.displayData).toEqual("pei");
  });

  it("renders a dash for an order with no payment method, and is readonly", () => {
    // Act
    const cell = cellFor([{ key: "to_pack", value: "1" }]);

    // Assert
    expect(cell.displayData).toEqual("-");
    expect(cell.readonly).toBe(true);
  });
});
