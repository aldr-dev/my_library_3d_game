"use client";

// Фоновые книги на полках: тысячи экземпляров рисуются одним
// InstancedMesh (общая геометрия, уникальный цвет и размер у каждой).

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { computeDecorBooks, type BookSlot } from "./shelfLayout";

interface DecorBooksProps {
  slots: BookSlot[];
}

export default function DecorBooks({ slots }: DecorBooksProps) {
  const books = useMemo(() => computeDecorBooks(slots), [slots]);
  const ref = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const color = new THREE.Color();

    books.forEach((b, i) => {
      e.set(0, b.rotationY, b.roll, "YXZ");
      q.setFromEuler(e);
      p.set(b.position[0], b.position[1], b.position[2]);
      s.set(b.size[0], b.size[1], b.size[2]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      color.set(b.color);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [books]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  if (books.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, books.length]}
      receiveShadow
    />
  );
}
