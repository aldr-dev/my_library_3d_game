"use client";

// Книга «в руках»: настоящая книга с обложкой (реальной или fallback),
// корешком и страницами. Используется в правой руке Стива (3-е лицо)
// и в руках от первого лица.

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Book } from "@/types/book";
import {
  bookColor,
  makeFallbackCoverTexture,
  makeSpineTexture,
} from "./bookTextures";

interface HeldBookMeshProps {
  book: Book;
  /** толщина книги (ось X — на ±X находятся обложки) */
  width?: number;
  height?: number;
  depth?: number;
  /**
   * Режим «поверх сцены» — для рук от первого лица: книга рисуется
   * последней и без depth-теста, поэтому не режется стенами и полками.
   */
  overlay?: boolean;
}

const OVERLAY_RENDER_ORDER = 21;

function HeldBookMesh({
  book,
  width = 0.07,
  height = 0.34,
  depth = 0.25,
  overlay = false,
}: HeldBookMeshProps) {
  // Порядок граней BoxGeometry: +x, -x, +y, -y, +z, -z.
  // Обложка — на +x, корешок — на +z.
  const mats = useMemo(() => {
    // в оверлейном режиме книга всегда должна быть читаемой,
    // даже если игрок стоит в тёмном углу
    const extra = overlay
      ? {
          depthTest: false,
          depthWrite: false,
          emissive: new THREE.Color("#ffffff"),
          emissiveIntensity: 0.12,
        }
      : {};

    const cover = new THREE.MeshStandardMaterial({
      map: makeFallbackCoverTexture(book),
      roughness: 0.55,
      ...extra,
    });
    const spine = new THREE.MeshStandardMaterial({
      map: makeSpineTexture(book),
      roughness: 0.55,
      ...extra,
    });
    const back = new THREE.MeshStandardMaterial({
      color: bookColor(book),
      roughness: 0.55,
      ...extra,
    });
    const pages = new THREE.MeshStandardMaterial({
      color: "#efe4cd",
      roughness: 0.9,
      ...extra,
    });
    return {
      cover,
      spine,
      list: [cover, back, pages, pages, spine, pages] as THREE.Material[],
    };
  }, [book, overlay]);

  // Загрузка настоящей обложки; при ошибке остаётся fallback.
  useEffect(() => {
    if (!book.coverUrl) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      book.coverUrl,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        const old = mats.cover.map;
        mats.cover.map = tex;
        mats.cover.needsUpdate = true;
        old?.dispose();
      },
      undefined,
      () => {
        /* оставляем fallback-обложку */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [book.coverUrl, mats]);

  // Освобождение GPU-ресурсов.
  useEffect(() => {
    return () => {
      mats.cover.map?.dispose();
      mats.spine.map?.dispose();
      mats.list.forEach((m) => m.dispose());
    };
  }, [mats]);

  return (
    <mesh
      castShadow={!overlay}
      frustumCulled={false}
      renderOrder={overlay ? OVERLAY_RENDER_ORDER : 0}
      material={mats.list}
    >
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  );
}

export default memo(HeldBookMesh);
