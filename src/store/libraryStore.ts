import { create } from "zustand";
import type { Book, BookStatus } from "@/types/book";
import {
  playDelete,
  playError,
  playPageFlip,
  playPickup,
  playPlace,
  playReturn,
  playSuccess,
  playUiClose,
  playUiOpen,
} from "@/lib/audio/sfx";

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

let toastId = 0;

interface LibraryState {
  books: Book[];
  loaded: boolean;
  nearbyBookId: string | null;
  selectedBookId: string | null;
  heldBookId: string | null;
  isAddModalOpen: boolean;
  isMenuOpen: boolean;
  isRandomOpen: boolean;
  toasts: Toast[];
  fetchBooks: () => Promise<void>;
  addBook: (book: Book) => void;
  removeBook: (id: string) => Promise<void>;
  updateStatus: (id: string, status: BookStatus) => Promise<void>;
  placeBook: (id: string, shelfIndex: number, rowIndex: number) => Promise<void>;
  setNearbyBook: (id: string | null) => void;
  selectBook: (id: string | null) => void;
  setHeldBook: (id: string | null) => void;
  setAddModalOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setRandomOpen: (open: boolean) => void;
  notify: (message: string, kind?: "success" | "error") => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  loaded: false,
  nearbyBookId: null,
  selectedBookId: null,
  heldBookId: null,
  isAddModalOpen: false,
  isMenuOpen: false,
  isRandomOpen: false,
  toasts: [],

  notify: (message, kind = "success") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  fetchBooks: async () => {
    try {
      const res = await fetch("/api/books");
      if (!res.ok) throw new Error();
      const data: { books: Book[] } = await res.json();
      set({ books: data.books, loaded: true });
    } catch {
      set({ loaded: true });
      playError();
      get().notify("Не удалось загрузить библиотеку", "error");
    }
  },

  addBook: (book) => {
    playSuccess();
    set((s) => ({ books: [...s.books, book] }));
  },

  removeBook: async (id) => {
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      set((s) => ({
        books: s.books.filter((b) => b.id !== id),
        selectedBookId: s.selectedBookId === id ? null : s.selectedBookId,
        nearbyBookId: s.nearbyBookId === id ? null : s.nearbyBookId,
        heldBookId: s.heldBookId === id ? null : s.heldBookId,
      }));
      playDelete();
      get().notify("Книга удалена из библиотеки");
    } catch {
      playError();
      get().notify("Не удалось удалить книгу", "error");
    }
  },

  updateStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const data: { book: Book } = await res.json();
      playPageFlip();
      set((s) => ({
        books: s.books.map((b) => (b.id === id ? data.book : b)),
      }));
    } catch {
      playError();
      get().notify("Не удалось обновить статус", "error");
    }
  },

  placeBook: async (id, shelfIndex, rowIndex) => {
    // оптимистичное обновление: книга сразу встаёт на выбранную полку
    playPlace();
    set((s) => ({
      heldBookId: null,
      books: s.books.map((b) =>
        b.id === id ? { ...b, shelfIndex, rowIndex } : b,
      ),
    }));
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelfIndex, rowIndex }),
      });
      if (!res.ok) throw new Error();
      const data: { book: Book } = await res.json();
      set((s) => ({
        books: s.books.map((b) => (b.id === id ? data.book : b)),
      }));
      get().notify("Книга поставлена на полку");
    } catch {
      playError();
      get().notify("Не удалось сохранить позицию книги", "error");
      get().fetchBooks();
    }
  },

  setNearbyBook: (id) => set({ nearbyBookId: id }),

  selectBook: (id) => {
    if (id !== get().selectedBookId) {
      if (id) playPageFlip();
      else playUiClose();
    }
    set({ selectedBookId: id });
  },

  setHeldBook: (id) => {
    const prev = get().heldBookId;
    if (id !== prev) {
      if (id) playPickup();
      else playReturn();
    }
    set({ heldBookId: id });
  },

  setAddModalOpen: (open) => {
    if (open !== get().isAddModalOpen) {
      if (open) playUiOpen();
      else playUiClose();
    }
    set({ isAddModalOpen: open });
  },

  setMenuOpen: (open) => {
    if (open !== get().isMenuOpen) {
      if (open) playUiOpen();
      else playUiClose();
    }
    set({ isMenuOpen: open });
  },

  setRandomOpen: (open) => {
    if (open !== get().isRandomOpen) {
      if (open) playUiOpen();
      else playUiClose();
    }
    set({ isRandomOpen: open });
  },
}));

// Проверка «открыт ли какой-либо UI поверх 3D» без подписки на стор.
export function isUiOpen(): boolean {
  const s = useLibraryStore.getState();
  return (
    s.isAddModalOpen ||
    s.isMenuOpen ||
    s.isRandomOpen ||
    s.selectedBookId !== null
  );
}
