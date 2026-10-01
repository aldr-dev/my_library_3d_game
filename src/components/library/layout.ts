// Статическая планировка большой библиотеки-особняка.
//
// Это единый источник правды: из этих данных строятся и 3D-меши комнаты,
// и система коллизий, и расстановка книг по полкам.
//
// Зал двухуровневый: первый этаж + галерея (балкон) вдоль стен,
// на которую ведёт парадная лестница.

// ---------------------------------------------------------------- комната

export const ROOM = { width: 34, depth: 26, height: 8.4 };
export const HALF_W = ROOM.width / 2; // 17
export const HALF_D = ROOM.depth / 2; // 13

export const WAINSCOT_H = 1.15; // высота стеновых панелей

// ---------------------------------------------------------------- галерея

export const BALCONY_Y = 4.2; // уровень пола второго яруса
export const BALCONY_DEPTH = 3; // ширина галереи
export const BALCONY_SLAB = 0.32; // толщина перекрытия
export const RAIL_HEIGHT = 1.1;

// ---------------------------------------------------------------- игрок

export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.8;
export const STEP_UP = 0.45; // на какую высоту игрок «зашагивает» автоматически

// ---------------------------------------------------------------- шкафы

export interface ShelfKind {
  width: number;
  height: number;
  depth: number;
  panel: number; // толщина досок
  plinth: number; // высота цоколя
  cornice: boolean; // декоративный карниз сверху
  rows: number[]; // Y-центры полочных досок относительно основания
}

export const SHELF_KINDS = {
  // высокий шкаф основного зала
  tall: {
    width: 3.2,
    height: 4.6,
    depth: 0.62,
    panel: 0.06,
    plinth: 0.28,
    cornice: true,
    rows: [0.34, 0.92, 1.5, 2.08, 2.66, 3.24, 3.82],
  },
  // шкаф, встроенный в стену (ниша под галереей)
  wall: {
    width: 4.0,
    height: 3.8,
    depth: 0.52,
    panel: 0.06,
    plinth: 0.26,
    cornice: true,
    rows: [0.32, 0.9, 1.48, 2.06, 2.64, 3.22],
  },
  // шкаф на галерее второго яруса
  upper: {
    width: 3.0,
    height: 2.8,
    depth: 0.5,
    panel: 0.05,
    plinth: 0.2,
    cornice: false,
    rows: [0.26, 0.84, 1.42, 2.0],
  },
  // низкий шкаф-разделитель пространства
  low: {
    width: 2.4,
    height: 1.4,
    depth: 0.55,
    panel: 0.05,
    plinth: 0.16,
    cornice: true,
    rows: [0.24, 0.82],
  },
} satisfies Record<string, ShelfKind>;

export type ShelfKindName = keyof typeof SHELF_KINDS;

export interface ShelfPlacement {
  /** основание шкафа (Y = 0 на первом этаже, BALCONY_Y на галерее) */
  position: [number, number, number];
  rotationY: number;
  kind: ShelfKindName;
}

// Порядок важен: книги пользователя автоматически заполняют шкафы
// именно в этом порядке, поэтому первыми идут самые заметные.
export const BOOKSHELVES: ShelfPlacement[] = [
  // ---- встроенные шкафы дальней стены (прямо перед входом) ----
  { position: [-12.2, 0, -12.74], rotationY: 0, kind: "wall" },
  { position: [-7.9, 0, -12.74], rotationY: 0, kind: "wall" },
  { position: [-3.6, 0, -12.74], rotationY: 0, kind: "wall" },
  { position: [0.7, 0, -12.74], rotationY: 0, kind: "wall" },
  { position: [5.0, 0, -12.74], rotationY: 0, kind: "wall" },

  // ---- левое крыло: ряд, обращённый к залу ----
  { position: [-6.6, 0, -6.6], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-6.6, 0, -3.0], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-6.6, 0, 0.6], rotationY: Math.PI / 2, kind: "tall" },

  // ---- левое крыло: обратная сторона того же стеллажа ----
  { position: [-7.32, 0, -6.6], rotationY: -Math.PI / 2, kind: "tall" },
  { position: [-7.32, 0, -3.0], rotationY: -Math.PI / 2, kind: "tall" },
  { position: [-7.32, 0, 0.6], rotationY: -Math.PI / 2, kind: "tall" },

  // ---- левое крыло: второй стеллаж (образует проход) ----
  { position: [-10.4, 0, -6.6], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-10.4, 0, -3.0], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-10.4, 0, 0.6], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-11.12, 0, -6.6], rotationY: -Math.PI / 2, kind: "tall" },
  { position: [-11.12, 0, -3.0], rotationY: -Math.PI / 2, kind: "tall" },
  { position: [-11.12, 0, 0.6], rotationY: -Math.PI / 2, kind: "tall" },

  // ---- ниша вдоль левой стены (под галереей) ----
  { position: [-16.69, 0, -8.6], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-16.69, 0, -5.0], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-16.69, 0, -1.4], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-16.69, 0, 2.2], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-16.69, 0, 5.8], rotationY: Math.PI / 2, kind: "tall" },
  { position: [-16.69, 0, 9.4], rotationY: Math.PI / 2, kind: "tall" },

  // ---- ниша вдоль правой стены ----
  { position: [16.69, 0, -8.6], rotationY: -Math.PI / 2, kind: "tall" },
  { position: [16.69, 0, -5.0], rotationY: -Math.PI / 2, kind: "tall" },
  { position: [16.69, 0, -1.4], rotationY: -Math.PI / 2, kind: "tall" },

  // ---- низкие шкафы-разделители в центре зала ----
  { position: [-5.4, 0, 6.6], rotationY: 0, kind: "low" },
  { position: [7.6, 0, 6.6], rotationY: 0, kind: "low" },

  // ---- галерея: дальняя стена ----
  { position: [-12.0, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [-8.4, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [-4.8, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [-1.2, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [2.4, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [6.0, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [9.6, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },
  { position: [13.2, BALCONY_Y, -12.75], rotationY: 0, kind: "upper" },

  // ---- галерея: левая стена ----
  { position: [-16.75, BALCONY_Y, -6.0], rotationY: Math.PI / 2, kind: "upper" },
  { position: [-16.75, BALCONY_Y, -2.4], rotationY: Math.PI / 2, kind: "upper" },
  { position: [-16.75, BALCONY_Y, 1.2], rotationY: Math.PI / 2, kind: "upper" },
  { position: [-16.75, BALCONY_Y, 4.8], rotationY: Math.PI / 2, kind: "upper" },
  { position: [-16.75, BALCONY_Y, 8.4], rotationY: Math.PI / 2, kind: "upper" },

  // ---- галерея: правая стена ----
  { position: [16.75, BALCONY_Y, -6.0], rotationY: -Math.PI / 2, kind: "upper" },
  { position: [16.75, BALCONY_Y, -2.4], rotationY: -Math.PI / 2, kind: "upper" },
  { position: [16.75, BALCONY_Y, 1.2], rotationY: -Math.PI / 2, kind: "upper" },
  { position: [16.75, BALCONY_Y, 4.8], rotationY: -Math.PI / 2, kind: "upper" },
];

// ---------------------------------------------------------------- лестница

export const STAIRS = {
  minX: 8.6,
  maxX: 12.6,
  zBottom: -1.5, // первая ступень (со стороны зала)
  zTop: -10.0, // выход на галерею
  steps: 18,
  top: BALCONY_Y,
};

export const STAIR_RISE = STAIRS.top / STAIRS.steps;
export const STAIR_RUN = (STAIRS.zBottom - STAIRS.zTop) / STAIRS.steps;

// ---------------------------------------------------------------- колонны

export const COLUMNS: [number, number][] = [
  // вдоль внутреннего края левой галереи
  [-14, -10],
  [-14, -5],
  [-14, 0],
  [-14, 5],
  [-14, 10],
  // вдоль внутреннего края правой галереи
  [14, -10],
  [14, -5],
  [14, 0],
  [14, 5],
  [14, 10],
  // вдоль внутреннего края задней галереи
  [-8, -10],
  [-2, -10],
  [4, -10],
];

// ---------------------------------------------------------------- перила

export interface RailingSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  y: number;
}

export const RAILINGS: RailingSegment[] = [
  // задняя галерея (с проёмом под лестницу)
  { x1: -14, z1: -10, x2: STAIRS.minX, z2: -10, y: BALCONY_Y },
  { x1: STAIRS.maxX, z1: -10, x2: 14, z2: -10, y: BALCONY_Y },
  // боковые галереи
  { x1: -14, z1: -10, x2: -14, z2: 12.9, y: BALCONY_Y },
  { x1: 14, z1: -10, x2: 14, z2: 12.9, y: BALCONY_Y },
];

// ---------------------------------------------------------------- мебель

export const DESK: {
  position: [number, number, number];
  size: [number, number, number];
} = {
  position: [2, 0, 0.6],
  size: [5.4, 0.78, 1.7],
};

export const CHAIRS: { position: [number, number, number]; rotationY: number }[] =
  [
    { position: [0.2, 0, 1.95], rotationY: Math.PI },
    { position: [3.8, 0, 2.05], rotationY: Math.PI * 0.92 },
    { position: [0.4, 0, -0.85], rotationY: 0.08 },
    { position: [3.6, 0, -0.8], rotationY: -0.12 },
  ];

export const ARMCHAIRS: {
  position: [number, number, number];
  rotationY: number;
}[] = [
  { position: [10.4, 0, 8.6], rotationY: Math.PI * 0.86 },
  { position: [12.8, 0, 6.2], rotationY: Math.PI * 1.22 },
  { position: [-3.6, 0, 9.8], rotationY: Math.PI * 0.06 },
];

export const SIDE_TABLES: [number, number, number][] = [
  [11.9, 0, 7.6],
  [-5.4, 0, 9.2],
];

export const FLOOR_LAMPS: [number, number, number][] = [
  [13.2, 0, 9.8],
  [-6.2, 0, 10.6],
];

export const PLANTS: [number, number, number][] = [
  [-6.8, 0, 11.8],
  [15.5, 0, 11.6],
  [7.4, 0, -9.6],
  [-13.0, 0, 11.6],
];

export const GLOBE: [number, number, number] = [6.6, 0, 3.4];
export const CLOCK: [number, number, number] = [16.3, 0, 8.2];
export const LADDER: [number, number, number] = [-9.9, 0, 2.4];

export const RUGS: {
  position: [number, number, number];
  size: [number, number];
  rotationY: number;
  variant: 0 | 1;
}[] = [
  { position: [2, 0.012, 0.6], size: [9.5, 6.4], rotationY: 0, variant: 0 },
  { position: [11.4, 0.012, 7.8], size: [5.4, 4.4], rotationY: 0.2, variant: 1 },
  { position: [-4.6, 0.012, 9.9], size: [4.2, 3.2], rotationY: -0.15, variant: 1 },
];

// ---------------------------------------------------------------- платформы

export interface Platform {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
}

export const PLATFORMS: Platform[] = [
  // задняя галерея
  { minX: -HALF_W, maxX: HALF_W, minZ: -HALF_D, maxZ: -10, y: BALCONY_Y },
  // левая галерея
  { minX: -HALF_W, maxX: -14, minZ: -HALF_D, maxZ: HALF_D, y: BALCONY_Y },
  // правая галерея
  { minX: 14, maxX: HALF_W, minZ: -HALF_D, maxZ: HALF_D, y: BALCONY_Y },
];

/**
 * Высота пола под точкой (x, z) для игрока, находящегося на высоте y.
 * Учитываются только поверхности, на которые игрок может зашагнуть,
 * поэтому под галереей возвращается уровень первого этажа.
 */
export function floorHeightAt(x: number, z: number, y: number): number {
  const limit = y + STEP_UP;
  let h = 0;

  // ступени лестницы
  if (
    x > STAIRS.minX &&
    x < STAIRS.maxX &&
    z > STAIRS.zTop &&
    z < STAIRS.zBottom
  ) {
    const t = (STAIRS.zBottom - z) / (STAIRS.zBottom - STAIRS.zTop);
    const step = Math.min(STAIRS.steps, Math.max(1, Math.ceil(t * STAIRS.steps)));
    const sh = step * STAIR_RISE;
    if (sh <= limit && sh > h) h = sh;
  }

  for (const p of PLATFORMS) {
    if (
      x > p.minX &&
      x < p.maxX &&
      z > p.minZ &&
      z < p.maxZ &&
      p.y <= limit &&
      p.y > h
    ) {
      h = p.y;
    }
  }

  return h;
}

// ---------------------------------------------------------------- коллизии

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  base: number; // нижняя граница по Y
  height: number; // верхняя граница по Y
}

function box(
  cx: number,
  cz: number,
  w: number,
  d: number,
  base: number,
  top: number,
): BoxCollider {
  return {
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
    base,
    height: top,
  };
}

function shelfCollider(s: ShelfPlacement): BoxCollider {
  const k = SHELF_KINDS[s.kind];
  const rotated = Math.abs(Math.sin(s.rotationY)) > 0.5;
  const w = rotated ? k.depth : k.width;
  const d = rotated ? k.width : k.depth;
  return box(s.position[0], s.position[2], w, d, s.position[1], s.position[1] + k.height);
}

function railingCollider(r: RailingSegment): BoxCollider {
  return {
    minX: Math.min(r.x1, r.x2) - 0.1,
    maxX: Math.max(r.x1, r.x2) + 0.1,
    minZ: Math.min(r.z1, r.z2) - 0.1,
    maxZ: Math.max(r.z1, r.z2) + 0.1,
    base: r.y,
    height: r.y + RAIL_HEIGHT,
  };
}

export const STATIC_COLLIDERS: BoxCollider[] = [
  // ---- стены ----
  { minX: -HALF_W - 1, maxX: -HALF_W, minZ: -HALF_D - 1, maxZ: HALF_D + 1, base: 0, height: ROOM.height },
  { minX: HALF_W, maxX: HALF_W + 1, minZ: -HALF_D - 1, maxZ: HALF_D + 1, base: 0, height: ROOM.height },
  { minX: -HALF_W - 1, maxX: HALF_W + 1, minZ: -HALF_D - 1, maxZ: -HALF_D, base: 0, height: ROOM.height },
  { minX: -HALF_W - 1, maxX: HALF_W + 1, minZ: HALF_D, maxZ: HALF_D + 1, base: 0, height: ROOM.height },

  // ---- книжные шкафы ----
  ...BOOKSHELVES.map(shelfCollider),

  // ---- колонны ----
  ...COLUMNS.map(([x, z]) => box(x, z, 0.72, 0.72, 0, BALCONY_Y)),

  // ---- перекрытие галереи (чтобы камера не проходила сквозь) ----
  ...PLATFORMS.map((p) => ({
    minX: p.minX,
    maxX: p.maxX,
    minZ: p.minZ,
    maxZ: p.maxZ,
    base: p.y - BALCONY_SLAB,
    height: p.y,
  })),

  // ---- перила галереи ----
  ...RAILINGS.map(railingCollider),

  // ---- боковые стенки лестницы ----
  {
    minX: STAIRS.minX - 0.28,
    maxX: STAIRS.minX,
    minZ: STAIRS.zTop,
    maxZ: STAIRS.zBottom,
    base: 0,
    height: BALCONY_Y + 0.2,
  },
  {
    minX: STAIRS.maxX,
    maxX: STAIRS.maxX + 0.28,
    minZ: STAIRS.zTop,
    maxZ: STAIRS.zBottom,
    base: 0,
    height: BALCONY_Y + 0.2,
  },

  // ---- мебель ----
  box(DESK.position[0], DESK.position[2], DESK.size[0], DESK.size[2], 0, DESK.size[1]),
  ...ARMCHAIRS.map((a) => box(a.position[0], a.position[2], 1.2, 1.2, 0, 1.05)),
  ...SIDE_TABLES.map((p) => box(p[0], p[2], 0.7, 0.7, 0, 0.6)),
  ...FLOOR_LAMPS.map((p) => box(p[0], p[2], 0.5, 0.5, 0, 1.9)),
  ...PLANTS.map((p) => box(p[0], p[2], 0.9, 0.9, 0, 1.6)),
  box(GLOBE[0], GLOBE[2], 0.8, 0.8, 0, 1.25),
  box(CLOCK[0], CLOCK[2], 0.7, 0.7, 0, 2.4),
  box(LADDER[0], LADDER[2], 0.7, 0.9, 0, 2.6),
];
