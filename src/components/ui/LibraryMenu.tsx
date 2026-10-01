"use client";

import { useEffect, useMemo, useState } from "react";
import { useLibraryStore } from "@/store/libraryStore";
import type { Book, BookStatus } from "@/types/book";

type Filter = "all" | BookStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "reading", label: "Читаю" },
  { value: "completed", label: "Прочитано" },
  { value: "planned", label: "В планах" },
];

const STATUS_LABELS: Record<BookStatus, string> = {
  planned: "В планах",
  reading: "Читаю",
  completed: "Прочитано",
};

const STATUS_STYLES: Record<BookStatus, string> = {
  planned: "border-sky-300/20 bg-sky-400/10 text-sky-200",
  reading: "border-violet-300/20 bg-violet-400/10 text-violet-200",
  completed: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
};

function matchesQuery(book: Book, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    book.title.toLowerCase().includes(needle) ||
    book.authors.some((a) => a.toLowerCase().includes(needle)) ||
    (book.isbn ?? "").toLowerCase().includes(needle)
  );
}

export default function LibraryMenu() {
  const isOpen = useLibraryStore((s) => s.isMenuOpen);
  const setOpen = useLibraryStore((s) => s.setMenuOpen);
  const books = useLibraryStore((s) => s.books);
  const selectBook = useLibraryStore((s) => s.selectBook);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setFilter("all");
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

  // Статистика считается только при изменении списка книг.
  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const completed = books.filter((b) => b.status === "completed");
    const completedDates = completed
      .map((b) => (b.completedAt ? new Date(b.completedAt) : null))
      .filter((d): d is Date => d !== null);
    return {
      total: books.length,
      thisYear: completedDates.filter((d) => d.getFullYear() === year).length,
      thisMonth: completedDates.filter(
        (d) => d.getFullYear() === year && d.getMonth() === month,
      ).length,
      pages: completed.reduce((sum, b) => sum + (b.pageCount ?? 0), 0),
      authors: new Set(books.flatMap((b) => b.authors)).size,
    };
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return books.filter(
      (b) =>
        (filter === "all" || b.status === filter) &&
        (q === "" || matchesQuery(b, q)),
    );
  }, [books, filter, query]);

  if (!isOpen) return null;

  const openBook = (id: string) => {
    setOpen(false);
    selectBook(id);
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-40 flex justify-start bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="modal-panel relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-r-3xl border-r border-amber-100/10 bg-gradient-to-b from-[#241c14]/95 to-[#17110c]/95 shadow-[24px_0_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* декоративное тёплое свечение сверху */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />

        {/* шапка */}
        <div className="relative flex items-start justify-between px-6 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100/10 bg-amber-200/10 text-2xl shadow-inner">
              📚
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-amber-50">
                Моя библиотека
              </h2>
              <p className="mt-0.5 text-xs text-white/40">
                {books.length}{" "}
                {books.length % 10 === 1 && books.length % 100 !== 11
                  ? "книга"
                  : "книг"}{" "}
                в коллекции
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

        {/* статистика */}
        <div className="relative mx-6 mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-amber-100">{stats.total}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              книг
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-amber-100">
              {stats.thisYear}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              за год
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-amber-100">
              {stats.thisMonth}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              за месяц
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-amber-100">
              {stats.pages.toLocaleString("ru-RU")}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              страниц прочитано
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-amber-100">
              {stats.authors}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              авторов
            </p>
          </div>
        </div>

        {/* поиск */}
        <div className="relative mx-6 mt-5">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/30">
            🔍
          </span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, автору или ISBN…"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 shadow-inner outline-none transition focus:border-amber-200/40 focus:bg-black/40 focus:shadow-[0_0_0_4px_rgba(251,211,141,0.08)]"
          />
        </div>

        {/* фильтры */}
        <div className="mx-6 mt-3 flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f.value
                  ? "bg-gradient-to-b from-amber-200 to-amber-300/90 text-[#2b2013] shadow-[0_2px_12px_rgba(251,211,141,0.35)]"
                  : "border border-white/8 bg-white/[0.04] text-white/50 hover:border-amber-100/20 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* список книг */}
        <div className="thin-scroll mt-4 flex-1 overflow-y-auto px-6 pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex gap-2 text-3xl opacity-60">
                <span className="-rotate-6">📕</span>
                <span>📗</span>
                <span className="rotate-6">📘</span>
              </div>
              <p className="mt-3 text-sm text-white/45">
                {books.length === 0
                  ? "Библиотека пуста — добавьте первую книгу"
                  : "Ничего не найдено по вашему запросу"}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((b, i) => (
                <li
                  key={b.id}
                  className="result-card"
                  style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                >
                  <button
                    onClick={() => openBook(b.id)}
                    className="group flex w-full gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-left transition hover:border-amber-100/20 hover:bg-amber-100/[0.05]"
                  >
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="h-16 w-11 shrink-0 rounded-md object-cover shadow-[0_6px_16px_rgba(0,0,0,0.5)] transition duration-200 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-md border border-amber-100/10 bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-lg shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
                        📕
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-amber-50">
                        {b.title}
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {b.authors.join(", ") || "Автор неизвестен"}
                      </p>
                      <span
                        className={`mt-1.5 inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[b.status]}`}
                      >
                        {STATUS_LABELS[b.status]}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* футер */}
        <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-3">
          <span className="text-[11px] text-white/30">
            Клик по книге — подробности
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
