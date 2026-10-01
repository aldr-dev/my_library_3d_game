"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BookSlot } from "./shelfLayout";
import {
  bookColor,
  makeFallbackCoverTexture,
  makeSpineTexture,
} from "./bookTextures";

interface Book3DProps {
  slot: BookSlot;
  isNearby: boolean;
  isSelected: boolean;
}

function Book3D({ slot, isNearby, isSelected }: Book3DProps) {
  const { book, size, outward } = slot;
  const group = useRef<THREE.Group>(null);
  const slide = useRef(0);

  // Материалы создаются один раз на книгу и переиспользуются между кадрами.
  // Порядок граней BoxGeometry: +x, -x, +y, -y, +z, -z.
  const mats = useMemo(() => {
    const emissive = new THREE.Color("#ffb066");
    const cover = new THREE.MeshStandardMaterial({
      map: makeFallbackCoverTexture(book),
      roughness: 0.55,
      emissive,
      emissiveIntensity: 0,
    });
    const spine = new THREE.MeshStandardMaterial({
      map: makeSpineTexture(book),
      roughness: 0.55,
      emissive,
      emissiveIntensity: 0,
    });
    const back = new THREE.MeshStandardMaterial({
      color: bookColor(book),
      roughness: 0.55,
    });
    const pages = new THREE.MeshStandardMaterial({
      color: "#efe4cd",
      roughness: 0.9,
    });
    return {
      cover,
      spine,
      list: [cover, back, pages, pages, spine, pages] as THREE.Material[],
    };
  }, [book]);

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

  // Освобождение GPU-ресурсов при удалении книги.
  useEffect(() => {
    return () => {
      mats.cover.map?.dispose();
      mats.spine.map?.dispose();
      mats.list.forEach((m) => m.dispose());
    };
  }, [mats]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = Math.min(1, delta * 8);

    // плавное выдвижение из полки
    const targetSlide = isSelected ? 0.22 : isNearby ? 0.08 : 0;
    slide.current += (targetSlide - slide.current) * k;
    g.position.set(
      slot.position[0] + outward[0] * slide.current,
      slot.position[1],
      slot.position[2] + outward[1] * slide.current,
    );

    // лёгкое увеличение
    const targetScale = isNearby || isSelected ? 1.04 : 1;
    const s = g.scale.x + (targetScale - g.scale.x) * k;
    g.scale.setScalar(s);

    // тёплая подсветка
    const targetEmissive = isSelected ? 0.45 : isNearby ? 0.3 : 0;
    mats.cover.emissiveIntensity +=
      (targetEmissive - mats.cover.emissiveIntensity) * k;
    mats.spine.emissiveIntensity = mats.cover.emissiveIntensity;
  });

  return (
    <group
      ref={group}
      position={slot.position}
      rotation={[0, slot.rotationY, 0]}
    >
      <mesh castShadow material={mats.list}>
        <boxGeometry args={[size.width, size.height, size.depth]} />
      </mesh>
    </group>
  );
}

export default memo(Book3D);
