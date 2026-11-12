import {
  orderListPath,
  orderListUrl,
  orderListUrlWithChannel,
  orderListUrlWithChannelAndStatuses,
  orderListUrlWithCustomerEmail,
  orderListUrlWithCustomerId,
} from "./urls";

describe("Order URLs", () => {
  describe("orderListUrl", () => {
    it("should return base path when no params provided", () => {
      const result = orderListUrl();

      expect(result).toBe("/orders");
    });

    it("should return base path when params is undefined", () => {
      const result = orderListUrl(undefined);

      expect(result).toBe("/orders");
    });

    it("should build URL with query parameters", () => {
      const params = {
        customer: "test@example.com",
        status: ["UNFULFILLED"],
      };
      const result = orderListUrl(params);

      expect(result).toContain("/orders?");
      expect(result).toContain("customer=test%40example.com");
      expect(result).toContain("status%5B0%5D=UNFULFILLED"); // Arrays are encoded as [0]
    });
  });

  describe("orderListUrlWithCustomerEmail", () => {
    it("should return orderListPath when userEmail is undefined", () => {
      const result = orderListUrlWithCustomerEmail(undefined);

      expect(result).toBe(orderListPath);
    });

    it("should build URL with userEmail filter", () => {
      const userEmail = "test@example.com";
      const result = orderListUrlWithCustomerEmail(userEmail);

      expect(result).toContain("/orders?");
      expect(result).toContain("userEmail");
      expect(result).toContain("test%40example.com");
    });
  });

  describe("orderListUrlWithCustomerId", () => {
    it("should return orderListPath when userId is undefined", () => {
      const result = orderListUrlWithCustomerId(undefined);

      expect(result).toBe(orderListPath);
    });

    it("should build URL with customer filter", () => {
      const userId = "VXNlcjoxMjM=";
      const result = orderListUrlWithCustomerId(userId);

      expect(result).toContain("/orders?");
      expect(result).toContain("customer");
      expect(result).toContain(encodeURIComponent(userId));
    });
  });

  describe("orderListUrlWithChannelAndStatuses", () => {
    it("serializes the channel and every status into the URL", () => {
      // Arrange
      const channel = { id: "Q2hhbm5lbDox", name: "Fífa", slug: "fifa" };

      // Act
      const result = orderListUrlWithChannelAndStatuses(channel, [
        "UNFULFILLED",
        "PARTIALLY_FULFILLED",
      ]);
      const query = decodeURIComponent(result.split("?")[1]);

      // Assert
      expect(result.startsWith("/orders?")).toBe(true);
      expect(query).toContain("fifa");
      expect(query).toContain("AND");
      expect(query).toContain("UNFULFILLED");
      expect(query).toContain("PARTIALLY_FULFILLED");
      expect(query.indexOf("fifa")).toBeLessThan(query.indexOf("UNFULFILLED"));
    });

    it("omits the channel filter when there is no channel", () => {
      // Act
      const result = orderListUrlWithChannelAndStatuses(undefined, ["UNFULFILLED"]);
      const query = decodeURIComponent(result.split("?")[1]);

      // Assert
      expect(query).toContain("UNFULFILLED");
      expect(query).not.toContain("AND");
    });
  });

  describe("orderListUrlWithChannel", () => {
    it("should return orderListPath when channel is undefined", () => {
      // Arrange
      // Act
      const result = orderListUrlWithChannel(undefined);

      // Assert
      expect(result).toBe(orderListPath);
    });

    it("should build URL with channel filter using channel slug", () => {
      // Arrange
      const channel = {
        id: "Q2hhbm5lbDox",
        name: "Channel-USD",
        slug: "channel-usd",
      };

      // Act
      const result = orderListUrlWithChannel(channel);

      // Assert
      expect(result).toContain("/orders?");
      expect(result).toContain("channel");
      expect(result).toContain("channel-usd");
    });
  });
});
