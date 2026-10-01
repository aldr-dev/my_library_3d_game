"use client";

import * as THREE from "three";
import { SHELF_KINDS, type ShelfPlacement } from "./layout";

const woodMat = new THREE.MeshStandardMaterial({
  color: "#5b3a20",
  roughness: 0.74,
});
const woodDarkMat = new THREE.MeshStandardMaterial({
  color: "#3f2714",
  roughness: 0.78,
});
const backMat = new THREE.MeshStandardMaterial({
  color: "#33200f",
  roughness: 0.9,
});

interface BookshelfProps {
  placement: ShelfPlacement;
}

export default function Bookshelf({ placement }: BookshelfProps) {
  const k = SHELF_KINDS[placement.kind];
  const { width: W, height: H, depth: D, panel: P } = k;

  return (
    <group position={placement.position} rotation={[0, placement.rotationY, 0]}>
      {/* боковые панели */}
      <mesh
        castShadow
        receiveShadow
        position={[-W / 2 + P / 2, H / 2, 0]}
        material={woodMat}
      >
        <boxGeometry args={[P, H, D]} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[W / 2 - P / 2, H / 2, 0]}
        material={woodMat}
      >
        <boxGeometry args={[P, H, D]} />
      </mesh>

      {/* верхняя доска */}
      <mesh
        castShadow
        receiveShadow
        position={[0, H - P / 2, 0]}
        material={woodMat}
      >
        <boxGeometry args={[W, P, D]} />
      </mesh>

      {/* цоколь */}
      <mesh
        castShadow
        receiveShadow
        position={[0, k.plinth / 2, 0]}
        material={woodDarkMat}
      >
        <boxGeometry args={[W, k.plinth, D]} />
      </mesh>

      {/* декоративный карниз */}
      {k.cornice && (
        <>
          <mesh castShadow position={[0, H + 0.06, 0.03]} material={woodDarkMat}>
            <boxGeometry args={[W + 0.18, 0.12, D + 0.1]} />
          </mesh>
          <mesh position={[0, H + 0.16, 0.03]} material={woodMat}>
            <boxGeometry args={[W + 0.1, 0.08, D + 0.06]} />
          </mesh>
        </>
      )}

      {/* задняя стенка */}
      <mesh
        receiveShadow
        position={[0, H / 2, -D / 2 + P / 2]}
        material={backMat}
      >
        <boxGeometry args={[W - P * 2, H, P]} />
      </mesh>

      {/* полочные доски */}
      {k.rows.map((y) => (
        <mesh
          key={y}
          castShadow
          receiveShadow
          position={[0, y, 0]}
          material={woodMat}
        >
          <boxGeometry args={[W - P * 2, P, D - P]} />
        </mesh>
      ))}
    </group>
  );
}
