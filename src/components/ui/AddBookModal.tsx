"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLibraryStore } from "@/store/libraryStore";
import type { Book, BookSearchResult } from "@/types/book";

export default function AddBookModal() {
  const isOpen = useLibraryStore((s) => s.isAddModalOpen);
  const setOpen = useLibraryStore((s) => s.setAddModalOpen);
  const addBook = useLibraryStore((s) => s.addBook);
  const notify = useLibraryStore((s) => s.notify);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults(null);
      setError(null);
      setLoading(false);
      setAddingKey(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const search = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
      const data: { results?: BookSearchResult[]; error?: string } =
        await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка поиска");
        return;
      }
      if (!data.results || data.results.length === 0) {
        setError(
          "Книга не найдена. Попробуйте указать ISBN или более точное название.",
        );
        return;
      }
      setResults(data.results);
    } catch {
      setError("Сервис поиска недоступен. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  };

  const add = async (r: BookSearchResult) => {
    setAddingKey(r.key);
    setError(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: r.title,
          authors: r.authors,
          coverUrl: r.coverUrl,
          isbn: r.isbn,
          publishedDate: r.publishedDate,
          pageCount: r.pageCount,
          categories: r.categories,
          status: "completed",
          completedAt: new Date().toISOString(),
        }),
      });
      const data: { book?: Book; error?: string } = await res.json();
      if (!res.ok || !data.book) {
        setError(data.error ?? "Не удалось добавить книгу");
        return;
      }
      addBook(data.book);
      notify(`«${r.title}» добавлена в библиотеку`);
      setOpen(false);
    } catch {
      setError("Не удалось сохранить книгу. Попробуйте ещё раз.");
    } finally {
      setAddingKey(null);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <div
        className="modal-panel relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-amber-200/15 bg-gradient-to-b from-[#26201a]/95 to-[#17110c]/95 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* декоративное тёплое свечение сверху */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />

        {/* шапка */}
        <div className="relative flex items-start justify-between px-7 pt-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-2xl shadow-inner">
              📖
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-amber-50">
                Добавить книгу
              </h2>
              <p className="mt-0.5 text-xs text-white/40">
                Найдите книгу по названию или ISBN — она появится на полке
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-white/5 bg-white/5 px-2.5 py-1.5 text-sm text-white/50 transition hover:border-white/10 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* поиск */}
        <form onSubmit={search} className="relative px-7 pt-6">
          <div className="group relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/30 transition group-focus-within:text-amber-200/80">
              🔍
            </span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="«Мастер и Маргарита», «The Hobbit» или ISBN…"
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-3.5 pl-12 pr-32 text-sm text-white placeholder-white/25 shadow-inner outline-none transition focus:border-amber-200/40 focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(251,211,141,0.08)]"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-b from-amber-200 to-amber-300/90 px-4 py-2 text-sm font-semibold text-[#2b2013] shadow-[0_2px_12px_rgba(251,211,141,0.35)] transition hover:shadow-[0_2px_16px_rgba(251,211,141,0.5)] active:scale-[0.97] disabled:opacity-35 disabled:shadow-none"
            >
              {loading ? "Ищем…" : "Найти"}
            </button>
          </div>
        </form>

        {/* контент */}
        <div className="flex-1 overflow-y-auto px-7 pb-4 pt-5">
          {/* skeleton при загрузке */}
          {loading && (
            <ul className="space-y-3">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="flex animate-pulse gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <div className="h-28 w-[4.5rem] shrink-0 rounded-lg bg-white/10" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                    <div className="h-3 w-1/3 rounded bg-white/5" />
                    <div className="mt-3 h-8 w-40 rounded-lg bg-white/5" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* ошибка / не найдено */}
          {error && !loading && (
            <div className="result-card flex flex-col items-center rounded-2xl border border-red-400/15 bg-red-500/[0.07] px-6 py-8 text-center">
              <span className="text-3xl">🕮</span>
              <p className="mt-3 text-sm font-medium text-red-100">{error}</p>
              <p className="mt-1 text-xs text-white/35">
                Совет: ISBN даёт самый точный результат
              </p>
            </div>
          )}

          {/* стартовая подсказка */}
          {!results && !error && !loading && (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="flex gap-2 text-3xl opacity-60">
                <span className="-rotate-6">📕</span>
                <span>📗</span>
                <span className="rotate-6">📘</span>
              </div>
              <p className="mt-4 text-sm text-white/45">
                Начните вводить название — мы найдём книгу
                <br />
                вместе с обложкой и данными об издании
              </p>
            </div>
          )}

          {/* результаты */}
          {results && !loading && (
            <ul className="space-y-3">
              {results.map((r, i) => (
                <li
                  key={r.key}
                  className="result-card group relative flex gap-4 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition duration-200 hover:border-amber-200/25 hover:bg-amber-100/[0.05]"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  {/* обложка */}
                  {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverUrl}
                      alt={r.title}
                      className="h-28 w-[4.5rem] shrink-0 rounded-lg object-cover shadow-[0_6px_16px_rgba(0,0,0,0.5)] transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-28 w-[4.5rem] shrink-0 items-center justify-center rounded-lg border border-amber-200/10 bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-3xl shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
                      📕
                    </div>
                  )}

                  {/* данные */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-amber-50">
                      {r.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/55">
                      {r.authors.join(", ") || "Автор неизвестен"}
                    </p>

                    {/* чипы: год и страницы */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.publishedDate && (
                        <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                          🗓 {r.publishedDate}
                        </span>
                      )}
                      {r.pageCount && (
                        <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                          📄 {r.pageCount} стр.
                        </span>
                      )}
                      {r.isbn && (
                        <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
                          ISBN {r.isbn}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => add(r)}
                      disabled={addingKey !== null}
                      className="mt-3 rounded-xl bg-gradient-to-b from-amber-200 to-amber-300/90 px-4 py-2 text-xs font-semibold text-[#2b2013] shadow-[0_2px_10px_rgba(251,211,141,0.3)] transition hover:shadow-[0_2px_14px_rgba(251,211,141,0.45)] active:scale-[0.97] disabled:opacity-35 disabled:shadow-none"
                    >
                      {addingKey === r.key
                        ? "Ставим на полку…"
                        : "+ Добавить в библиотеку"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* футер */}
        <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-7 py-3">
          <span className="text-[11px] text-white/30">
            Данные предоставляет Open Library
          </span>
          <span className="text-[11px] text-white/30">
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/50">
              Esc
            </kbd>{" "}
            — закрыть
          </span>
        </div>
      </div>
    </div>
  );
}
