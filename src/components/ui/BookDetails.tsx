"use client";

import { useEffect, useState } from "react";
import { useLibraryStore } from "@/store/libraryStore";
import type { BookStatus } from "@/types/book";

const STATUS_OPTIONS: { value: BookStatus; label: string; icon: string }[] = [
  { value: "planned", label: "В планах", icon: "🔖" },
  { value: "reading", label: "Читаю", icon: "📖" },
  { value: "completed", label: "Прочитано", icon: "✓" },
];

export default function BookDetails() {
  const selectedBookId = useLibraryStore((s) => s.selectedBookId);
  const book = useLibraryStore((s) =>
    s.books.find((b) => b.id === s.selectedBookId),
  );
  const selectBook = useLibraryStore((s) => s.selectBook);
  const removeBook = useLibraryStore((s) => s.removeBook);
  const updateStatus = useLibraryStore((s) => s.updateStatus);

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectBook(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBookId, selectBook]);

  if (!book) return null;

  const completedDate = book.completedAt
    ? new Date(book.completedAt).toLocaleDateString("ru-RU")
    : null;

  return (
    <div className="pointer-events-none fixed inset-y-0 right-4 z-30 flex items-center">
      <div className="panel-right pointer-events-auto flex max-h-[calc(100vh-2rem)] w-[22rem] flex-col overflow-hidden rounded-3xl border border-amber-100/10 bg-gradient-to-b from-[#241c14]/95 to-[#17110c]/95 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        {/* декоративное тёплое свечение сверху */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />

        {/* шапка */}
        <div className="relative flex shrink-0 items-start justify-between px-6 pt-6">
          <h2 className="pr-2 text-lg font-semibold leading-snug tracking-wide text-amber-50">
            {book.title}
          </h2>
          <button
            onClick={() => selectBook(null)}
            className="shrink-0 rounded-xl border border-white/5 bg-white/5 px-2.5 py-1.5 text-sm text-white/50 transition hover:border-white/10 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* контент */}
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-4">
          {/* обложка + автор */}
          <div className="flex gap-4">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-40 w-[6.5rem] shrink-0 rounded-lg object-cover shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
              />
            ) : (
              <div className="flex h-40 w-[6.5rem] shrink-0 items-center justify-center rounded-lg border border-amber-100/10 bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-4xl shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
                📕
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/85">
                {book.authors.join(", ") || "Автор неизвестен"}
              </p>

              {/* чипы */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {book.publishedDate && (
                  <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                    🗓 {book.publishedDate}
                  </span>
                )}
                {book.pageCount && (
                  <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                    📄 {book.pageCount} стр.
                  </span>
                )}
                {book.isbn && (
                  <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
                    ISBN {book.isbn}
                  </span>
                )}
              </div>

              {completedDate && (
                <p className="mt-3 inline-block rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                  ✓ Прочитана {completedDate}
                </p>
              )}
            </div>
          </div>

          {/* описание */}
          {book.description && (
            <p className="thin-scroll mt-4 max-h-28 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-3 text-xs leading-relaxed text-white/55">
              {book.description}
            </p>
          )}

          {/* категории */}
          {book.categories && book.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {book.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-amber-100/10 bg-amber-200/5 px-2 py-0.5 text-[11px] text-amber-100/70"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* статус — сегментированные кнопки */}
          <div className="mt-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Статус
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(book.id, opt.value)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                    book.status === opt.value
                      ? "bg-gradient-to-b from-amber-200 to-amber-300/90 text-[#2b2013] shadow-[0_2px_12px_rgba(251,211,141,0.35)]"
                      : "border border-white/8 bg-white/[0.04] text-white/50 hover:border-amber-100/20 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* удаление */}
          <div className="mt-5">
            {confirmDelete ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.08] p-3">
                <p className="text-center text-xs text-red-100/90">
                  Удалить книгу из библиотеки?
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => removeBook(book.id)}
                    className="flex-1 rounded-xl bg-gradient-to-b from-red-400 to-red-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_2px_12px_rgba(248,113,113,0.35)] transition hover:shadow-[0_2px_16px_rgba(248,113,113,0.5)] active:scale-[0.97]"
                  >
                    Да, удалить
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-200 transition hover:border-red-400/40 hover:bg-red-500/20"
              >
                🗑 Убрать из библиотеки
              </button>
            )}
          </div>
        </div>

        {/* футер */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-black/20 px-6 py-3">
          <span className="text-[11px] text-white/30">Карточка книги</span>
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
