import { render, screen } from "@testing-library/react";

import { AppDialog } from "./AppDialog";

describe("AppDialog", () => {
  it("fills the viewport and gives the iframe box the remaining height", () => {
    render(
      <AppDialog open onClose={jest.fn()} title="Bulk edit">
        <div data-test-id="app-content" />
      </AppDialog>,
    );

    const content = screen.getByTestId("app-dialog-content");

    expect(content).toHaveStyle({
      width: "calc(100% - 32px)",
      maxWidth: "none",
      height: "calc(100% - 32px)",
      maxHeight: "calc(100% - 32px)",
      gridTemplateRows: "auto minmax(0, 1fr)",
    });
    expect(screen.getByTestId("app-dialog-frame")).toContainElement(
      screen.getByTestId("app-content"),
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Bulk edit");
  });
});
