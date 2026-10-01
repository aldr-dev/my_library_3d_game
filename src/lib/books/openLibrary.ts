import type { BookSearchResult } from "@/types/book";

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
}

const FIELDS =
  "key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,subject";

function docToResult(d: OpenLibraryDoc & { title: string }): BookSearchResult {
  return {
    key: d.key,
    title: d.title,
    authors: d.author_name ?? [],
    coverUrl: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
      : undefined,
    isbn: d.isbn?.[0],
    publishedDate: d.first_publish_year
      ? String(d.first_publish_year)
      : undefined,
    pageCount: d.number_of_pages_median,
    categories: d.subject?.slice(0, 4),
  };
}

export async function searchOpenLibrary(
  query: string,
): Promise<BookSearchResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query,
  )}&limit=8&fields=${FIELDS}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "personal-3d-library" },
  });
  if (!res.ok) {
    throw new Error(`Open Library responded with ${res.status}`);
  }

  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };

  return (data.docs ?? [])
    .filter((d): d is OpenLibraryDoc & { title: string } => Boolean(d.title))
    .map(docToResult);
}

// Жанры для «случайной книги» — популярные темы Open Library,
// чтобы выдача была качественной и разнообразной.
const RANDOM_SUBJECTS = [
  "fantasy",
  "science_fiction",
  "classic_literature",
  "adventure",
  "mystery",
  "historical_fiction",
  "philosophy",
  "biography",
  "thriller",
  "romance",
];

export async function randomOpenLibraryBook(): Promise<BookSearchResult | null> {
  const subject =
    RANDOM_SUBJECTS[Math.floor(Math.random() * RANDOM_SUBJECTS.length)];
  // случайная страница выдачи, чтобы книги не повторялись
  const offset = Math.floor(Math.random() * 150);

  const url = `https://openlibrary.org/search.json?q=subject:${subject}&sort=rating&limit=20&offset=${offset}&fields=${FIELDS}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "personal-3d-library" },
  });
  if (!res.ok) {
    throw new Error(`Open Library responded with ${res.status}`);
  }

  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  const docs = (data.docs ?? []).filter(
    (d): d is OpenLibraryDoc & { title: string } => Boolean(d.title),
  );
  if (docs.length === 0) return null;

  // предпочитаем книги с обложкой — на полке и в карточке они выглядят лучше
  const withCover = docs.filter((d) => d.cover_i);
  const pool = withCover.length > 0 ? withCover : docs;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  return docToResult(pick);
}
