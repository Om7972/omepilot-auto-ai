export interface Source {
  id: number;
  title: string;
  url: string;
}

export interface ImageResult {
  title: string;
  url: string;
  sourceUrl: string;
}

export interface SearchResult {
  answer: string;
  sources: Source[];
  query: string;
  followUps?: string[];
  images?: ImageResult[];
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export interface SavedSearch {
  id: string;
  query: string;
  result: SearchResult;
  searchTime: number;
  savedAt: number;
}
