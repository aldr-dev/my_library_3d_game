"use client";

import { RefObject, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useLibraryStore } from "@/store/libraryStore";
import { playDenied } from "@/lib/audio/sfx";
import {
  SHELF_ROW_TARGETS,
  rowHasSpaceFor,
  type BookSlot,
  type ShelfRowTarget,
} from "./shelfLayout";

// Максимальная дистанция взаимодействия от игрока (как reach в Minecraft).
const REACH = 3.6;
// Небольшое расширение хитбокса книги — легче целиться.
const TARGET_MARGIN = 0.02;

// Пересечение луча с AABB (slab-метод). Возвращает t входа или null.
function rayAabb(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): number | null {
  let tmin = 0;
  let tmax = Infinity;
  const o = [ox, oy, oz];
  const d = [dx, dy, dz];
  const mn = [minX, minY, minZ];
  const mx = [maxX, maxY, maxZ];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-8) {
      if (o[i] < mn[i] || o[i] > mx[i]) return null;
    } else {
      let t1 = (mn[i] - o[i]) / d[i];
      let t2 = (mx[i] - o[i]) / d[i];
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

// Мировой AABB книги. Повороты полок кратны 90°, поэтому
// достаточно поменять местами ширину и глубину.
function slotWorldAabb(slot: BookSlot) {
  const rotated = Math.abs(Math.sin(slot.rotationY)) > 0.5;
  const hw = (rotated ? slot.size.depth : slot.size.width) / 2 + TARGET_MARGIN;
  const hd = (rotated ? slot.size.width : slot.size.depth) / 2 + TARGET_MARGIN;
  const hh = slot.size.height / 2 + TARGET_MARGIN;
  return {
    minX: slot.position[0] - hw,
    maxX: slot.position[0] + hw,
    minY: slot.position[1] - hh,
    maxY: slot.position[1] + hh,
    minZ: slot.position[2] - hd,
    maxZ: slot.position[2] + hd,
  };
}

interface InteractionSystemProps {
  slots: BookSlot[];
  playerRef: RefObject<THREE.Group | null>;
}

export default function InteractionSystem({
  slots,
  playerRef,
}: InteractionSystemProps) {
  const { camera } = useThree();
  const targetRow = useRef<ShelfRowTarget | null>(null);
  const highlightRef = useRef<THREE.Mesh>(null);
  const dir = useRef(new THREE.Vector3()).current;

  // E — подробности книги под прицелом, Q — вернуть взятую книгу.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = useLibraryStore.getState();
      if (s.isAddModalOpen || s.isMenuOpen || s.isRandomOpen || s.selectedBookId)
        return;
      if (e.code === "KeyE" && !s.heldBookId && s.nearbyBookId) {
        s.selectBook(s.nearbyBookId);
        document.exitPointerLock();
      }
      if (e.code === "KeyQ" && s.heldBookId) {
        s.setHeldBook(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ЛКМ — взять книгу под прицелом / поставить на полку под прицелом.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!document.pointerLockElement) return;
      const s = useLibraryStore.getState();
      if (s.isAddModalOpen || s.isMenuOpen || s.isRandomOpen || s.selectedBookId)
        return;

      if (s.heldBookId) {
        const t = targetRow.current;
        if (!t) return;
        if (!rowHasSpaceFor(slots, t.shelfIndex, t.rowIndex, s.heldBookId)) {
          playDenied();
          s.notify("На этой полке нет места", "error");
          return;
        }
        s.placeBook(s.heldBookId, t.shelfIndex, t.rowIndex);
      } else if (s.nearbyBookId) {
        s.setHeldBook(s.nearbyBookId);
        s.setNearbyBook(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [slots]);

  useFrame(() => {
    const store = useLibraryStore.getState();
    const player = playerRef.current;
    const uiOpen =
      store.isAddModalOpen ||
      store.isMenuOpen ||
      store.isRandomOpen ||
      store.selectedBookId !== null;

    const highlight = highlightRef.current;

    if (uiOpen) {
      if (highlight) highlight.visible = false;
      if (store.nearbyBookId) store.setNearbyBook(null);
      targetRow.current = null;
      return;
    }

    camera.getWorldDirection(dir);
    const ox = camera.position.x;
    const oy = camera.position.y;
    const oz = camera.position.z;

    // ----- Режим переноса книги (книга в правой руке персонажа) -----
    if (store.heldBookId) {
      if (store.nearbyBookId) store.setNearbyBook(null);

      // прицеливание по полочным рядам
      let best: ShelfRowTarget | null = null;
      let bestT = Infinity;
      for (const t of SHELF_ROW_TARGETS) {
        const hit = rayAabb(
          ox, oy, oz,
          dir.x, dir.y, dir.z,
          t.min[0], t.min[1], t.min[2],
          t.max[0], t.max[1], t.max[2],
        );
        if (hit !== null && hit < bestT) {
          bestT = hit;
          best = t;
        }
      }
      // ограничение дальности от игрока
      if (best && player) {
        const hx = ox + dir.x * bestT;
        const hz = oz + dir.z * bestT;
        const dxp = hx - player.position.x;
        const dzp = hz - player.position.z;
        if (dxp * dxp + dzp * dzp > REACH * REACH) best = null;
      }
      targetRow.current = best;

      // подсветка целевого ряда
      if (highlight) {
        if (best) {
          highlight.visible = true;
          highlight.position.set(
            (best.min[0] + best.max[0]) / 2,
            (best.min[1] + best.max[1]) / 2,
            (best.min[2] + best.max[2]) / 2,
          );
          highlight.scale.set(
            Math.max(0.1, best.max[0] - best.min[0]),
            best.max[1] - best.min[1],
            Math.max(0.1, best.max[2] - best.min[2]),
          );
        } else {
          highlight.visible = false;
        }
      }
      return;
    }

    // ----- Режим прицеливания по книгам -----
    if (highlight) highlight.visible = false;
    targetRow.current = null;

    let bestId: string | null = null;
    let bestT = Infinity;
    for (const slot of slots) {
      const b = slotWorldAabb(slot);
      const hit = rayAabb(
        ox, oy, oz,
        dir.x, dir.y, dir.z,
        b.minX, b.minY, b.minZ,
        b.maxX, b.maxY, b.maxZ,
      );
      if (hit !== null && hit < bestT) {
        bestT = hit;
        bestId = slot.book.id;
      }
    }
    if (bestId !== null && player) {
      const hx = ox + dir.x * bestT;
      const hz = oz + dir.z * bestT;
      const dxp = hx - player.position.x;
      const dzp = hz - player.position.z;
      if (dxp * dxp + dzp * dzp > REACH * REACH) bestId = null;
    }
    if (store.nearbyBookId !== bestId) store.setNearbyBook(bestId);
  });

  return (
    <>
      {/* подсветка целевого полочного ряда при переносе */}
      <mesh ref={highlightRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ffd9a0"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
