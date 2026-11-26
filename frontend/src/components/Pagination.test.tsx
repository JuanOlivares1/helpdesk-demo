import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Pagination from "./Pagination";

function renderPagination(page: number, pages: number, status = "") {
  return render(
    <MemoryRouter>
      <Pagination page={page} pages={pages} status={status} />
    </MemoryRouter>,
  );
}

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = renderPagination(1, 1);
    expect(container).toBeEmptyDOMElement();
  });

  it("links to the next page and keeps the status filter", () => {
    renderPagination(1, 3, "open");

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/?status=open&page=2",
    );
    expect(screen.getByText("Page 1 of 3")).toBeVisible();
    expect(screen.getByText("Previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("disables Next on the last page", () => {
    renderPagination(3, 3);

    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByText("Next")).toHaveAttribute("aria-disabled", "true");
  });
});
