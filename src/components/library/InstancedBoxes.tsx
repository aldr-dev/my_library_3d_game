"use client";

// Утилита для массовой отрисовки одинаковых прямоугольных элементов
// (балясины, ступени, потолочные балки) одним draw call.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export interface BoxInstance {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
}

interface InstancedBoxesProps {
  items: BoxInstance[];
  material: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export default function InstancedBoxes({
  items,
  material,
  castShadow = false,
  receiveShadow = false,
}: InstancedBoxesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    items.forEach((it, i) => {
      e.set(
        it.rotation?.[0] ?? 0,
        it.rotation?.[1] ?? 0,
        it.rotation?.[2] ?? 0,
        "YXZ",
      );
      q.setFromEuler(e);
      p.set(it.position[0], it.position[1], it.position[2]);
      s.set(it.scale[0], it.scale[1], it.scale[2]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (items.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}
