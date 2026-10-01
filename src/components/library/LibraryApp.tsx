"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import LibraryScene from "./LibraryScene";
import AddBookModal from "@/components/ui/AddBookModal";
import BookDetails from "@/components/ui/BookDetails";
import LibraryMenu from "@/components/ui/LibraryMenu";
import RandomBookModal from "@/components/ui/RandomBookModal";
import { useLibraryStore } from "@/store/libraryStore";
import { isMuted, toggleMuted, unlockAudio } from "@/lib/audio/sfx";

const CONTROL_HINTS: { keys: string; label: string }[] = [
  { keys: "WASD", label: "движение" },
  { keys: "Мышь", label: "камера" },
  { keys: "Shift", label: "бег" },
  { keys: "E", label: "подробности" },
  { keys: "ЛКМ", label: "взять/поставить" },
  { keys: "V", label: "вид" },
  { keys: "Tab", label: "книги" },
  { keys: "M", label: "звук" },
];

export default function LibraryApp() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [locked, setLocked] = useState(false);
  const [soundOff, setSoundOff] = useState(false);

  const books = useLibraryStore((s) => s.books);
  const loaded = useLibraryStore((s) => s.loaded);
  const fetchBooks = useLibraryStore((s) => s.fetchBooks);
  const nearbyBookId = useLibraryStore((s) => s.nearbyBookId);
  const selectedBookId = useLibraryStore((s) => s.selectedBookId);
  const heldBookId = useLibraryStore((s) => s.heldBookId);
  const isAddModalOpen = useLibraryStore((s) => s.isAddModalOpen);
  const isMenuOpen = useLibraryStore((s) => s.isMenuOpen);
  const isRandomOpen = useLibraryStore((s) => s.isRandomOpen);
  const setAddModalOpen = useLibraryStore((s) => s.setAddModalOpen);
  const setMenuOpen = useLibraryStore((s) => s.setMenuOpen);
  const setRandomOpen = useLibraryStore((s) => s.setRandomOpen);
  const toasts = useLibraryStore((s) => s.toasts);

  const uiOpen =
    isAddModalOpen || isMenuOpen || isRandomOpen || selectedBookId !== null;

  const heldBook = books.find((b) => b.id === heldBookId);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Состояние звука восстанавливается из localStorage на клиенте.
  useEffect(() => {
    setSoundOff(isMuted());
  }, []);

  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement !== null);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  // Первый жест пользователя разблокирует Web Audio.
  useEffect(() => {
    const onFirstGesture = () => unlockAudio();
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, []);

  // Tab — открыть/закрыть список книг, M — выключить/включить звук.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useLibraryStore.getState();

      if (e.code === "KeyM") {
        // не глушим звук, когда пользователь печатает в поле ввода
        const el = document.activeElement;
        const typing =
          el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
        if (typing) return;
        setSoundOff(toggleMuted());
        return;
      }

      if (e.code !== "Tab") return;
      e.preventDefault();
      if (s.isAddModalOpen || s.isRandomOpen || s.selectedBookId) return;
      if (s.isMenuOpen) {
        s.setMenuOpen(false);
      } else {
        document.exitPointerLock();
        s.setMenuOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const requestLock = () => {
    unlockAudio();
    wrapperRef.current?.querySelector("canvas")?.requestPointerLock();
  };

  const toggleSound = () => {
    unlockAudio();
    setSoundOff(toggleMuted());
  };

  const thisYear = new Date().getFullYear();
  const completedBooks = books.filter((b) => b.status === "completed");
  const readThisYear = completedBooks.filter(
    (b) => b.completedAt && new Date(b.completedAt).getFullYear() === thisYear,
  ).length;
  const readingNow = books.filter((b) => b.status === "reading").length;

  return (
    <div ref={wrapperRef} className="fixed inset-0 bg-[#171310]">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, 3, 8] }}
        onClick={requestLock}
      >
        <Suspense fallback={null}>
          <LibraryScene />
        </Suspense>
      </Canvas>

      {/* прицел по центру экрана (как в Minecraft) */}
      {locked && !uiOpen && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 shadow-[0_0_4px_rgba(0,0,0,0.9)]" />
          <div className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 shadow-[0_0_4px_rgba(0,0,0,0.9)]" />
        </div>
      )}

      {/* HUD: верхняя панель — логотип */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-3 rounded-2xl border border-amber-200/10 bg-gradient-to-b from-[#26201a]/80 to-[#17110c]/80 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <span className="text-xl">📚</span>
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-amber-100">
            MY LIBRARY
          </p>
          <p className="text-[11px] text-white/40">
            {completedBooks.length}{" "}
            {completedBooks.length % 10 === 1 && completedBooks.length % 100 !== 11
              ? "книга прочитана"
              : "книг прочитано"}
          </p>
        </div>
      </div>

      {/* HUD: кнопки + статистика */}
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-3">
        <div className="flex gap-2">
          <button
            onClick={toggleSound}
            title={soundOff ? "Включить звук (M)" : "Выключить звук (M)"}
            aria-label={soundOff ? "Включить звук" : "Выключить звук"}
            className={`rounded-2xl border px-3.5 py-2.5 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl transition ${
              soundOff
                ? "border-white/10 bg-gradient-to-b from-[#26201a]/80 to-[#17110c]/80 text-white/40 hover:text-white/70"
                : "border-amber-200/15 bg-gradient-to-b from-[#26201a]/80 to-[#17110c]/80 text-amber-100 hover:border-amber-200/30 hover:bg-white/5"
            }`}
          >
            {soundOff ? "🔇" : "🔊"}
          </button>
          <button
            onClick={() => {
              document.exitPointerLock();
              setRandomOpen(true);
            }}
            className="rounded-2xl border border-amber-200/15 bg-gradient-to-b from-[#26201a]/80 to-[#17110c]/80 px-4 py-2.5 text-sm font-semibold text-amber-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-amber-200/30 hover:bg-white/5"
          >
            🎲 Случайная
          </button>
          <button
            onClick={() => {
              document.exitPointerLock();
              setMenuOpen(true);
            }}
            className="rounded-2xl border border-amber-200/15 bg-gradient-to-b from-[#26201a]/80 to-[#17110c]/80 px-4 py-2.5 text-sm font-semibold text-amber-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-amber-200/30 hover:bg-white/5"
          >
            ☰ Мои книги
          </button>
          <button
            onClick={() => {
              document.exitPointerLock();
              setAddModalOpen(true);
            }}
            className="rounded-2xl bg-gradient-to-b from-amber-200 to-amber-300/90 px-4 py-2.5 text-sm font-semibold text-[#2b2013] shadow-[0_2px_16px_rgba(251,211,141,0.4)] transition hover:shadow-[0_2px_24px_rgba(251,211,141,0.55)] active:scale-[0.97]"
          >
            + Добавить книгу
          </button>
        </div>

        <div className="pointer-events-none grid grid-cols-3 gap-1.5 rounded-2xl border border-amber-200/10 bg-gradient-to-b from-[#26201a]/80 to-[#17110c]/80 p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-center">
            <p className="text-base font-semibold leading-tight text-amber-100">
              {books.length}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/35">
              книг
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-center">
            <p className="text-base font-semibold leading-tight text-amber-100">
              {readThisYear}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/35">
              за {thisYear}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-center">
            <p className="text-base font-semibold leading-tight text-amber-100">
              {readingNow}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-white/35">
              читаю
            </p>
          </div>
        </div>
      </div>

      {/* книга в руках */}
      {heldBook && !uiOpen && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-amber-200/25 bg-gradient-to-b from-[#26201a]/85 to-[#17110c]/85 px-5 py-3 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(251,211,141,0.12)] backdrop-blur-xl">
          <p className="text-sm text-amber-50/90">
            📖 В руках: «{heldBook.title}»
          </p>
          <p className="mt-1.5 text-xs text-white/50">
            <kbd className="rounded border border-amber-200/40 bg-amber-200/15 px-1.5 py-0.5 font-semibold text-amber-100">
              ЛКМ
            </kbd>{" "}
            — поставить на полку под прицелом ·{" "}
            <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-semibold text-white/70">
              Q
            </kbd>{" "}
            — вернуть
          </p>
        </div>
      )}

      {/* подсказка взаимодействия */}
      {nearbyBookId && !heldBook && !uiOpen && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-amber-200/25 bg-gradient-to-b from-[#26201a]/85 to-[#17110c]/85 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(251,211,141,0.12)] backdrop-blur-xl">
          <kbd className="rounded-lg border border-amber-200/40 bg-amber-200/15 px-2.5 py-1 text-sm font-bold text-amber-100 shadow-[0_0_10px_rgba(251,211,141,0.25)]">
            E
          </kbd>
          <span className="ml-2.5 text-sm text-amber-50/90">Подробности</span>
          <span className="mx-3 text-white/20">·</span>
          <kbd className="rounded-lg border border-amber-200/40 bg-amber-200/15 px-2.5 py-1 text-sm font-bold text-amber-100 shadow-[0_0_10px_rgba(251,211,141,0.25)]">
            ЛКМ
          </kbd>
          <span className="ml-2.5 text-sm text-amber-50/90">Взять книгу</span>
        </div>
      )}

      {/* подсказка управления */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/8 bg-gradient-to-b from-[#26201a]/70 to-[#17110c]/70 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {CONTROL_HINTS.map((h, i) => (
          <span
            key={h.keys}
            className={`flex items-center gap-1.5 text-[11px] text-white/45 ${
              i > 0 ? "border-l border-white/8 pl-3" : ""
            }`}
          >
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-medium text-white/60">
              {h.keys}
            </kbd>
            {h.label}
          </span>
        ))}
      </div>

      {/* empty state */}
      {loaded && books.length === 0 && !uiOpen && (
        <div className="pointer-events-none absolute left-1/2 top-28 z-20 -translate-x-1/2 rounded-3xl border border-amber-200/15 bg-gradient-to-b from-[#26201a]/85 to-[#17110c]/85 px-8 py-5 text-center shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="flex justify-center gap-1.5 text-2xl opacity-70">
            <span className="-rotate-6">📕</span>
            <span>📗</span>
            <span className="rotate-6">📘</span>
          </div>
          <p className="mt-3 text-sm font-medium text-amber-100">
            Ваша библиотека пуста
          </p>
          <p className="mt-1 text-xs text-white/45">
            Добавьте первую книгу и наблюдайте,
            <br />
            как полки наполняются
          </p>
        </div>
      )}

      {/* оверлей «кликните для управления» */}
      {!locked && !uiOpen && (
        <button
          onClick={requestLock}
          className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center bg-black/55 backdrop-blur-[3px]"
        >
          {/* виньетка + свечение */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col items-center">
            <span className="text-3xl">📚</span>
            <span className="mt-4 text-2xl font-semibold tracking-[0.35em] text-amber-100">
              MY LIBRARY
            </span>
            <span className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-200/10 px-6 py-2.5 text-sm font-medium text-amber-50 shadow-[0_0_24px_rgba(251,211,141,0.15)] transition group-hover:bg-amber-200/15">
              Кликните, чтобы войти в библиотеку
            </span>
            <span className="mt-4 text-xs text-white/35">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/50">
                Esc
              </kbd>{" "}
              — выйти из режима управления ·{" "}
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/50">
                M
              </kbd>{" "}
              — звук
            </span>
          </div>
        </button>
      )}

      {/* уведомления */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl ${
              t.kind === "error"
                ? "border-red-400/25 bg-gradient-to-b from-red-950/80 to-[#17110c]/85 text-red-100"
                : "border-amber-200/25 bg-gradient-to-b from-[#26201a]/85 to-[#17110c]/85 text-amber-50"
            }`}
          >
            <span className="text-base">
              {t.kind === "error" ? "⚠️" : "✨"}
            </span>
            {t.message}
          </div>
        ))}
      </div>

      <AddBookModal />
      <BookDetails />
      <LibraryMenu />
      <RandomBookModal />
    </div>
  );
}
