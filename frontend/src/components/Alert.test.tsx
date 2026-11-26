import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Alert from "./Alert";

describe("Alert", () => {
  it("announces errors assertively", () => {
    render(<Alert>Could not save the ticket</Alert>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not save the ticket");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("!");
  });

  it("uses a polite status for success and info", () => {
    const { rerender } = render(<Alert tone="success">Ticket updated.</Alert>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    rerender(<Alert tone="info">Loading users…</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading users…");
  });
});
