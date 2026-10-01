export type BookStatus = "planned" | "reading" | "completed";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
  isbn?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  status: BookStatus;
  completedAt?: string;
  createdAt: string;
  // параметры 3D
  width?: number;
  height?: number;
  depth?: number;
  // пользовательское размещение на полках (null/undefined — автоматически)
  shelfIndex?: number;
  rowIndex?: number;
}

export interface BookSearchResult {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  isbn?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
}
