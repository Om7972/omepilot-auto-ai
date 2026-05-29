/**
 * Verifies the SearchAnalytics table restores sort column, sort direction,
 * page, and page size after a refresh (unmount + remount) and when "opened
 * in a new tab" (fresh component instance reading the same localStorage).
 *
 * Both flows hit the same code path: the component's initial useState
 * factories read FILTERS_KEY from localStorage. Re-mounting in jsdom
 * faithfully simulates both scenarios.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SearchAnalytics } from "./SearchAnalytics";
import type { SearchHistoryItem, SavedSearch } from "./types";

const FILTERS_KEY = "web-search-analytics-filters";

function makeHistory(n: number): SearchHistoryItem[] {
  return Array.from({ length: n }, (_, i) => ({
    query: `query ${String(i + 1).padStart(3, "0")}`,
    timestamp: Date.now() - i * 60_000,
  }));
}

function seed(state: Record<string, unknown>) {
  localStorage.setItem(
    FILTERS_KEY,
    JSON.stringify({ range: "7", wordFilter: null, ...state })
  );
}

function pageSizeTrigger() {
  return screen.getByRole("combobox", { name: /Rows per page/i });
}

describe("SearchAnalytics persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("restores sort, direction, page, and page size from localStorage on mount", () => {
    seed({ sortKey: "query", sortDir: "asc", page: 3, pageSize: 25 });
    const saved: SavedSearch[] = [];
    render(<SearchAnalytics history={makeHistory(120)} saved={saved} />);

    expect(pageSizeTrigger()).toHaveTextContent("25");
    expect(screen.getByText(/Page 3 of/i)).toBeInTheDocument();

    const queryHeader = screen.getByRole("button", { name: /^Query$/ });
    expect(queryHeader.querySelector("svg.lucide-arrow-up")).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(FILTERS_KEY)!);
    expect(stored).toMatchObject({
      sortKey: "query",
      sortDir: "asc",
      page: 3,
      pageSize: 25,
    });
  });

  it("restores the same view after a refresh (unmount + remount)", () => {
    seed({ sortKey: "duration", sortDir: "desc", page: 2, pageSize: 50 });
    const history = makeHistory(150);

    const { unmount } = render(<SearchAnalytics history={history} saved={[]} />);
    expect(pageSizeTrigger()).toHaveTextContent("50");
    expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();

    unmount();
    render(<SearchAnalytics history={history} saved={[]} />);

    expect(pageSizeTrigger()).toHaveTextContent("50");
    expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();
    const durationHeader = screen.getByRole("button", { name: /^Duration$/ });
    expect(durationHeader.querySelector("svg.lucide-arrow-down")).toBeTruthy();

    expect(JSON.parse(localStorage.getItem(FILTERS_KEY)!)).toMatchObject({
      sortKey: "duration",
      sortDir: "desc",
      page: 2,
      pageSize: 50,
    });
  });

  it('restores the same view when "opened in a new tab" (fresh instance, same storage)', () => {
    seed({ sortKey: "timestamp", sortDir: "asc", page: 4, pageSize: 10 });
    render(<SearchAnalytics history={makeHistory(80)} saved={[]} />);

    expect(pageSizeTrigger()).toHaveTextContent("10");
    expect(screen.getByText(/Page 4 of/i)).toBeInTheDocument();
    const tsHeader = screen.getByRole("button", { name: /^Timestamp$/ });
    expect(tsHeader.querySelector("svg.lucide-arrow-up")).toBeTruthy();
  });
});
