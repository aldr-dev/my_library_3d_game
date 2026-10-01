// Динамическая раскладка книг по полкам.
//
// Позиции рассчитываются из единых данных планировки (layout.ts),
// поэтому книги всегда стоят ровно на досках шкафов любого типа.
//
// Книги с заданными shelfIndex/rowIndex стоят там, куда их поставил
// пользователь; остальные автоматически заполняют свободное место.
// Оставшееся место на полках занимают декоративные книги — они
// рисуются одним InstancedMesh и создают ощущение полной библиотеки.

import type { Book } from "@/types/book";
import { BOOKSHELVES, SHELF_KINDS, type ShelfKindName } from "./layout";

const GAP = 0.014; // зазор между книгами
const SIDE_MARGIN = 0.12; // отступ от боковых панелей
const BOOK_DEPTH = 0.2;
const FRONT_INSET = 0.035; // насколько книги утоплены от края полки

export interface BookSlot {
  book: Book;
  position: [number, number, number]; // мировые координаты центра книги
  rotationY: number;
  outward: [number, number]; // направление «из полки» в мировых XZ
  size: { width: number; height: number; depth: number };
  shelfIndex: number;
  rowIndex: number;
}

// AABB полочного ряда в мировых координатах — цель для прицеливания
// при переносе книги.
export interface ShelfRowTarget {
  shelfIndex: number;
  rowIndex: number;
  min: [number, number, number];
  max: [number, number, number];
}

// Декоративная книга (без данных пользователя) для инстансинга.
export interface DecorBook {
  position: [number, number, number];
  rotationY: number;
  roll: number; // наклон «привалившейся» книги
  size: [number, number, number];
  color: string;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function usableWidth(kind: ShelfKindName): number {
  const k = SHELF_KINDS[kind];
  return k.width - k.panel * 2 - SIDE_MARGIN * 2;
}

// Толщина книги зависит от количества страниц (с мин/макс границами),
// высота слегка варьируется детерминированно от id — полка выглядит живой.
function bookSize(book: Book): BookSlot["size"] {
  const pages = book.pageCount ?? 250;
  const width = clamp(0.028 + pages * 0.00008, 0.03, 0.105);
  const height = 0.3 + ((hashString(book.id) % 100) / 100) * 0.14;
  return { width, height, depth: BOOK_DEPTH };
}

function rowCount(shelfIndex: number): number {
  return SHELF_KINDS[BOOKSHELVES[shelfIndex].kind].rows.length;
}

function hasValidPlacement(book: Book): boolean {
  return (
    book.shelfIndex !== undefined &&
    book.rowIndex !== undefined &&
    book.shelfIndex >= 0 &&
    book.shelfIndex < BOOKSHELVES.length &&
    book.rowIndex >= 0 &&
    book.rowIndex < rowCount(book.shelfIndex)
  );
}

export function computeBookSlots(books: Book[]): BookSlot[] {
  // На полках стоят прочитанные книги.
  const shelved = books.filter((b) => b.status === "completed");

  // Матрица рядов: [шкаф][ряд] -> книги.
  const rows: Book[][][] = BOOKSHELVES.map((s) =>
    SHELF_KINDS[s.kind].rows.map(() => []),
  );
  const usedWidth: number[][] = BOOKSHELVES.map((s) =>
    SHELF_KINDS[s.kind].rows.map(() => 0),
  );
  const unassigned: Book[] = [];

  // Сначала — книги с пользовательским размещением.
  for (const book of shelved) {
    if (hasValidPlacement(book)) {
      const si = book.shelfIndex as number;
      const ri = book.rowIndex as number;
      rows[si][ri].push(book);
      usedWidth[si][ri] += bookSize(book).width + GAP;
    } else {
      unassigned.push(book);
    }
  }

  // Затем — автоматическое заполнение свободного места.
  outer: for (const book of unassigned) {
    const w = bookSize(book).width;
    for (let si = 0; si < rows.length; si++) {
      const uw = usableWidth(BOOKSHELVES[si].kind);
      for (let ri = 0; ri < rows[si].length; ri++) {
        if (usedWidth[si][ri] + w <= uw) {
          rows[si][ri].push(book);
          usedWidth[si][ri] += w + GAP;
          continue outer;
        }
      }
    }
    // все полки заполнены — книга не размещается
  }

  // Преобразование рядов в мировые слоты.
  const slots: BookSlot[] = [];
  rows.forEach((shelfRows, si) => {
    const shelf = BOOKSHELVES[si];
    const kind = SHELF_KINDS[shelf.kind];
    const uw = usableWidth(shelf.kind);
    const ry = shelf.rotationY;
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);

    shelfRows.forEach((rowBooks, ri) => {
      let cursor = -uw / 2;
      for (const book of rowBooks) {
        const size = bookSize(book);
        const localX = cursor + size.width / 2;
        const localY =
          shelf.position[1] + kind.rows[ri] + kind.panel / 2 + size.height / 2;
        const localZ = kind.depth / 2 - size.depth / 2 - FRONT_INSET;

        const wx = shelf.position[0] + localX * cos + localZ * sin;
        const wz = shelf.position[2] - localX * sin + localZ * cos;

        slots.push({
          book,
          position: [wx, localY, wz],
          rotationY: ry,
          outward: [sin, cos],
          size,
          shelfIndex: si,
          rowIndex: ri,
        });

        cursor += size.width + GAP;
      }
    });
  });

  return slots;
}

// Проверка: поместится ли книга в указанный ряд
// (сама книга исключается из расчёта — важно при переносе).
export function rowHasSpaceFor(
  slots: BookSlot[],
  shelfIndex: number,
  rowIndex: number,
  bookId: string,
): boolean {
  const uw = usableWidth(BOOKSHELVES[shelfIndex].kind);
  let used = 0;
  let bookWidth = 0.105; // fallback — максимальная толщина
  for (const s of slots) {
    if (s.book.id === bookId) {
      bookWidth = s.size.width;
      continue;
    }
    if (s.shelfIndex === shelfIndex && s.rowIndex === rowIndex) {
      used += s.size.width + GAP;
    }
  }
  return used + bookWidth <= uw;
}

// ---------------------------------------------------------- декоративные книги

// Палитра корешков: приглушённые тёплые и благородные тона.
const DECOR_HUES = [8, 18, 26, 34, 44, 92, 148, 196, 214, 262, 338, 12];

function decorColor(rnd: () => number): string {
  const hue =
    DECOR_HUES[Math.floor(rnd() * DECOR_HUES.length)] +
    Math.floor(rnd() * 14 - 7);
  const sat = 16 + Math.floor(rnd() * 36);
  const light = 19 + Math.floor(rnd() * 23);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/**
 * Заполняет оставшееся место на полках фоновыми книгами.
 * Результат детерминирован для каждой полки, поэтому библиотека
 * не «перемешивается» между кадрами.
 */
export function computeDecorBooks(slots: BookSlot[]): DecorBook[] {
  const used = new Map<string, number>();
  for (const s of slots) {
    const key = `${s.shelfIndex}:${s.rowIndex}`;
    used.set(key, (used.get(key) ?? 0) + s.size.width + GAP);
  }

  const out: DecorBook[] = [];

  BOOKSHELVES.forEach((shelf, si) => {
    const kind = SHELF_KINDS[shelf.kind];
    const uw = usableWidth(shelf.kind);
    const cos = Math.cos(shelf.rotationY);
    const sin = Math.sin(shelf.rotationY);

    kind.rows.forEach((rowY, ri) => {
      const rnd = mulberry32(si * 9176 + ri * 733 + 17);
      const baseY = shelf.position[1] + rowY + kind.panel / 2;
      const startUsed = used.get(`${si}:${ri}`) ?? 0;

      // часть полок заполнена плотно, часть — почти пуста
      const fill = 0.42 + rnd() * 0.58;
      const end = -uw / 2 + uw * Math.min(1, fill);
      let cursor = -uw / 2 + startUsed;

      const push = (
        localX: number,
        y: number,
        size: [number, number, number],
        roll: number,
      ) => {
        const localZ = kind.depth / 2 - size[2] / 2 - FRONT_INSET;
        out.push({
          position: [
            shelf.position[0] + localX * cos + localZ * sin,
            y,
            shelf.position[2] - localX * sin + localZ * cos,
          ],
          rotationY: shelf.rotationY,
          roll,
          size,
          color: decorColor(rnd),
        });
      };

      while (cursor < end - 0.05) {
        const roll = rnd();

        if (roll < 0.07 && end - cursor > 0.45) {
          // стопка лежащих книг
          const len = 0.26 + rnd() * 0.08;
          const count = 2 + Math.floor(rnd() * 3);
          let stackY = 0;
          for (let i = 0; i < count; i++) {
            const th = 0.032 + rnd() * 0.026;
            const dep = 0.17 + rnd() * 0.05;
            push(
              cursor + len / 2,
              baseY + stackY + th / 2,
              [len - i * 0.012, th, dep],
              0,
            );
            stackY += th;
          }
          cursor += len + 0.05;
        } else {
          const w = 0.026 + rnd() * 0.062;
          const h = 0.27 + rnd() * 0.17;
          const dep = 0.17 + rnd() * 0.06;
          // изредка книга «приваливается» к соседке
          const lean =
            rnd() < 0.06
              ? (rnd() < 0.5 ? -1 : 1) * (0.09 + rnd() * 0.12)
              : 0;
          const sinLean = Math.abs(Math.sin(lean));
          const y = baseY + (h / 2) * Math.cos(lean) + (w / 2) * sinLean;
          push(cursor + w / 2 + sinLean * h * 0.5, y, [w, h, dep], lean);
          cursor += w + GAP + sinLean * h;
        }
      }
    });
  });

  return out;
}

// ---------------------------------------------------------- цели прицеливания

const ROW_BOX_HEIGHT = 0.52;

function buildRowTargets(): ShelfRowTarget[] {
  const targets: ShelfRowTarget[] = [];

  BOOKSHELVES.forEach((shelf, si) => {
    const kind = SHELF_KINDS[shelf.kind];
    const ry = shelf.rotationY;
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    const corners: [number, number][] = [
      [-kind.width / 2, -kind.depth / 2],
      [-kind.width / 2, kind.depth / 2],
      [kind.width / 2, -kind.depth / 2],
      [kind.width / 2, kind.depth / 2],
    ];
    const xs = corners.map(([lx, lz]) => shelf.position[0] + lx * cos + lz * sin);
    const zs = corners.map(([lx, lz]) => shelf.position[2] - lx * sin + lz * cos);

    kind.rows.forEach((y, ri) => {
      const worldY = shelf.position[1] + y;
      targets.push({
        shelfIndex: si,
        rowIndex: ri,
        min: [Math.min(...xs), worldY, Math.min(...zs)],
        max: [Math.max(...xs), worldY + ROW_BOX_HEIGHT, Math.max(...zs)],
      });
    });
  });

  return targets;
}

export const SHELF_ROW_TARGETS: ShelfRowTarget[] = buildRowTargets();
