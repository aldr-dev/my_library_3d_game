import type { Book as DbBook } from "@prisma/client";
import type { Book, BookStatus } from "@/types/book";

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

const VALID_STATUSES: BookStatus[] = ["planned", "reading", "completed"];

export function dbBookToApi(row: DbBook): Book {
  const status = VALID_STATUSES.includes(row.status as BookStatus)
    ? (row.status as BookStatus)
    : "completed";
  return {
    id: row.id,
    title: row.title,
    authors: parseStringArray(row.authors),
    description: row.description ?? undefined,
    coverUrl: row.coverUrl ?? undefined,
    isbn: row.isbn ?? undefined,
    publishedDate: row.publishedDate ?? undefined,
    pageCount: row.pageCount ?? undefined,
    categories: parseStringArray(row.categories),
    status,
    completedAt: row.completedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    shelfIndex: row.shelfIndex ?? undefined,
    rowIndex: row.rowIndex ?? undefined,
  };
}
