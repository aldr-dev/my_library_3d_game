"use client";

import { useCallback, useEffect, useState } from "react";
import { useLibraryStore } from "@/store/libraryStore";
import type { Book, BookSearchResult } from "@/types/book";

export default function RandomBookModal() {
  const isOpen = useLibraryStore((s) => s.isRandomOpen);
  const setOpen = useLibraryStore((s) => s.setRandomOpen);
  const addBook = useLibraryStore((s) => s.addBook);
  const notify = useLibraryStore((s) => s.notify);

  const [book, setBook] = useState<BookSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBook(null);
    try {
      const res = await fetch("/api/books/random");
      const data: { book?: BookSearchResult; error?: string } =
        await res.json();
      if (!res.ok || !data.book) {
        setError(data.error ?? "Не удалось подобрать книгу");
        return;
      }
      setBook(data.book);
    } catch {
      setError("Сервис рекомендаций недоступен. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }, []);

  // При открытии сразу подбираем книгу; при закрытии сбрасываем состояние.
  useEffect(() => {
    if (isOpen) {
      roll();
    } else {
      setBook(null);
      setError(null);
      setLoading(false);
      setAdding(false);
    }
  }, [isOpen, roll]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const add = async () => {
    if (!book) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
          authors: book.authors,
          coverUrl: book.coverUrl,
          isbn: book.isbn,
          publishedDate: book.publishedDate,
          pageCount: book.pageCount,
          categories: book.categories,
          status: "planned",
        }),
      });
      const data: { book?: Book; error?: string } = await res.json();
      if (!res.ok || !data.book) {
        setError(data.error ?? "Не удалось добавить книгу");
        return;
      }
      addBook(data.book);
      notify(`«${book.title}» добавлена в планы чтения`);
      setOpen(false);
    } catch {
      setError("Не удалось сохранить книгу. Попробуйте ещё раз.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <div
        className="modal-panel relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-amber-200/15 bg-gradient-to-b from-[#26201a]/95 to-[#17110c]/95 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* декоративное тёплое свечение сверху */}
        <div className="glow-pulse pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

        {/* шапка */}
        <div className="relative flex items-start justify-between px-7 pt-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-2xl shadow-inner">
              🎲
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-amber-50">
                Случайная книга
              </h2>
              <p className="mt-0.5 text-xs text-white/40">
                Не знаете, что почитать? Доверьтесь случаю
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

        {/* контент */}
        <div className="thin-scroll relative flex-1 overflow-y-auto px-7 pb-5 pt-6">
          {/* загрузка — крутящийся кубик */}
          {loading && (
            <div className="flex flex-col items-center py-12">
              <span className="dice-spin inline-block text-6xl">🎲</span>
              <p className="mt-6 text-sm text-white/45">
                Перебираем полки в поисках книги…
              </p>
              <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full border border-white/5 bg-white/5">
                <div className="loading-bar h-full w-1/3 rounded-full bg-gradient-to-r from-amber-200/40 via-amber-200 to-amber-200/40 shadow-[0_0_12px_rgba(251,211,141,0.6)]" />
              </div>
            </div>
          )}

          {/* ошибка */}
          {error && !loading && (
            <div className="result-card flex flex-col items-center rounded-2xl border border-red-400/15 bg-red-500/[0.07] px-6 py-8 text-center">
              <span className="text-3xl">🕮</span>
              <p className="mt-3 text-sm font-medium text-red-100">{error}</p>
              <button
                onClick={roll}
                className="mt-4 rounded-xl bg-gradient-to-b from-amber-200 to-amber-300/90 px-4 py-2 text-xs font-semibold text-[#2b2013] shadow-[0_2px_10px_rgba(251,211,141,0.3)] transition hover:shadow-[0_2px_14px_rgba(251,211,141,0.45)] active:scale-[0.97]"
              >
                🎲 Попробовать снова
              </button>
            </div>
          )}

          {/* результат — карточка с 3D-переворотом */}
          {book && !loading && (
            <div className="random-card flex flex-col items-center text-center">
              {/* обложка с ореолом */}
              <div className="relative">
                <div className="glow-pulse pointer-events-none absolute -inset-6 rounded-full bg-amber-300/15 blur-2xl" />
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="relative h-56 w-[9.5rem] rounded-xl object-cover shadow-[0_16px_40px_rgba(0,0,0,0.7)]"
                  />
                ) : (
                  <div className="relative flex h-56 w-[9.5rem] items-center justify-center rounded-xl border border-amber-200/10 bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-5xl shadow-[0_16px_40px_rgba(0,0,0,0.7)]">
                    📕
                  </div>
                )}
              </div>

              <h3 className="mt-5 px-2 text-lg font-semibold leading-snug text-amber-50">
                {book.title}
              </h3>
              <p className="mt-1 text-sm text-white/55">
                {book.authors.join(", ") || "Автор неизвестен"}
              </p>

              {/* чипы */}
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
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
                {book.categories?.[0] && (
                  <span className="rounded-md border border-amber-200/15 bg-amber-200/5 px-2 py-0.5 text-[11px] text-amber-100/70">
                    {book.categories[0]}
                  </span>
                )}
              </div>

              {/* действия */}
              <div className="mt-6 flex w-full gap-2">
                <button
                  onClick={roll}
                  disabled={adding}
                  className="flex-1 rounded-xl border border-amber-200/20 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-200/35 hover:bg-white/10 active:scale-[0.97] disabled:opacity-35"
                >
                  🎲 Ещё раз
                </button>
                <button
                  onClick={add}
                  disabled={adding}
                  className="flex-1 rounded-xl bg-gradient-to-b from-amber-200 to-amber-300/90 px-4 py-2.5 text-sm font-semibold text-[#2b2013] shadow-[0_2px_12px_rgba(251,211,141,0.35)] transition hover:shadow-[0_2px_16px_rgba(251,211,141,0.5)] active:scale-[0.97] disabled:opacity-35 disabled:shadow-none"
                >
                  {adding ? "Добавляем…" : "🔖 Буду читать"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* футер */}
        <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-7 py-3">
          <span className="text-[11px] text-white/30">
            Книга добавится в «Хочу прочитать»
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
