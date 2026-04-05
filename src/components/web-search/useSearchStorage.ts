import { useState, useEffect } from "react";
import type { SearchHistoryItem, SavedSearch, SearchResult } from "./types";

const HISTORY_KEY = "web-search-history";
const SAVED_KEY = "web-search-saved";
const MAX_HISTORY = 10;
const MAX_SAVED = 50;

function loadJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function useSearchStorage() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => loadJson(HISTORY_KEY, []));
  const [saved, setSaved] = useState<SavedSearch[]>(() => loadJson(SAVED_KEY, []));

  const saveToHistory = (query: string) => {
    const updated = [{ query, timestamp: Date.now() }, ...loadJson<SearchHistoryItem[]>(HISTORY_KEY, []).filter(h => h.query !== query)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const saveSearch = (query: string, result: SearchResult, searchTime: number) => {
    const entry: SavedSearch = {
      id: crypto.randomUUID(),
      query,
      result,
      searchTime,
      savedAt: Date.now(),
    };
    const current = loadJson<SavedSearch[]>(SAVED_KEY, []);
    // Don't save duplicates
    if (current.some(s => s.query === query)) return false;
    const updated = [entry, ...current].slice(0, MAX_SAVED);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    setSaved(updated);
    return true;
  };

  const removeSaved = (id: string) => {
    const updated = loadJson<SavedSearch[]>(SAVED_KEY, []).filter(s => s.id !== id);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    setSaved(updated);
  };

  const isSearchSaved = (query: string) => saved.some(s => s.query === query);

  return { history, saved, saveToHistory, clearHistory, saveSearch, removeSaved, isSearchSaved };
}
