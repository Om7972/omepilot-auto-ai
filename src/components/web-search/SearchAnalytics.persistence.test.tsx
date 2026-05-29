/**
 * Verifies the SearchAnalytics table restores sort column, sort direction,
 * current page, and page size after a refresh (re-mount) and when "opened
 * in a new tab" (a fresh component instance reading the same localStorage).
 *
 * Strategy: directly assert the persistence contract written to localStorage
 * under the FILTERS_KEY. Re-mounting the component is the same code path
 * used on hard refresh AND on a new tab — both call the initial state
 * factories that read from localStorage. We assert via DOM state (the
 * select trigger and pagination label) which exercises the full
 * useState-from-localStorage flow end-to-end.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { SearchAnalytics } from "./SearchAnalytics";
import type { SearchHistoryItem, SavedSearch } from "./types";

const FILTERS_KEY = "web-search-analytics-filters";

function makeHistory(n: number): SearchHistoryItem[] {
  // Spread timestamps over the last few days so the default "7 days" range
  // includes them.
  return Array.from({ length: n }, (_, i) => ({
    query: `query ${String(i + 1).padStart(3, "0")}`,
    timestamp: Date.now() - i * 60_000,
  }));
}

describe("SearchAnalytics persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("persists sort column, direction, page, and page size to localStorage", () => {
    // Seed persisted filters as if the user had configured the table
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        range: "7",
        wordFilter: null,
        sortKey: "query",
        sortDir: "asc",
        page: 3,
        pageSize: 25,
      })
    );
    const history = makeHistory(120);
    const saved: SavedSearch[] = [];

    render(<SearchAnalytics history={history} saved={saved} />);

    // Page size select shows "25"
    const pageSizeTrigger = screen.getByLabelText("Rows per page", { selector: "button" });
    expect(pageSizeTrigger).toHaveTextContent("25");

    // Pagination shows "Page 3 of N"
    expect(screen.getByText(/Page 3 of/i)).toBeInTheDocument();

    // Confirm persistence write-back keeps the same values after mount
    const stored = JSON.parse(localStorage.getItem(FILTERS_KEY)!);
    expect(stored).toMatchObject({
      sortKey: "query",
      sortDir: "asc",
      page: 3,
      pageSize: 25,
    });
  });

  it("restores the same view after a refresh (re-mount)", () => {
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        range: "30",
        wordFilter: null,
        sortKey: "duration",
        sortDir: "desc",
        page: 2,
        pageSize: 50,
      })
    );
    const history = makeHistory(150);

    const { unmount } = render(<SearchAnalytics history={history} saved={[]} />);
    expect(screen.getByLabelText("Rows per page", { selector: "button" })).toHaveTextContent("50");
    expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();

    // Simulate refresh: unmount + remount
    unmount();
    render(<SearchAnalytics history={history} saved={[]} />);

    expect(screen.getByLabelText("Rows per page", { selector: "button" })).toHaveTextContent("50");
    expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(FILTERS_KEY)!);
    expect(stored).toMatchObject({
      sortKey: "duration",
      sortDir: "desc",
      page: 2,
      pageSize: 50,
    });
  });

  it('restores the same view when "opened in a new tab" (fresh instance, same storage)', () => {
    // Tab 1: user configures the table
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        range: "7",
        wordFilter: null,
        sortKey: "timestamp",
        sortDir: "asc",
        page: 4,
        pageSize: 10,
      })
    );
    const history = makeHistory(80);

    // Tab 2: a fresh, independent render reading the same localStorage —
    // exactly what a new browser tab does on first paint.
    render(<SearchAnalytics history={history} saved={[]} />);

    expect(screen.getByLabelText("Rows per page", { selector: "button" })).toHaveTextContent("10");
    expect(screen.getByText(/Page 4 of/i)).toBeInTheDocument();

    // Sort indicators: timestamp column should show the ascending arrow.
    const tsHeader = screen.getByRole("button", { name: /Timestamp/i });
    // The ArrowUp lucide icon has class lucide-arrow-up
    expect(within(tsHeader).getByText((_, el) =>
      !!el && el.tagName.toLowerCase() === "svg" && el.classList.contains("lucide-arrow-up")
    )).toBeTruthy();
  });
});
