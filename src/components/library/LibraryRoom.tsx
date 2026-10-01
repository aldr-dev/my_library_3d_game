"use client";

// Архитектура библиотеки: двухуровневый зал с галереей, парадной
// лестницей, колоннами, высокими окнами и обжитым интерьером.
//
// Вся геометрия строится из данных layout.ts, поэтому визуал
// и коллизии всегда совпадают.

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import Bookshelf from "./Bookshelf";
import InstancedBoxes, { type BoxInstance } from "./InstancedBoxes";
import {
  ARMCHAIRS,
  BALCONY_DEPTH,
  BALCONY_SLAB,
  BALCONY_Y,
  BOOKSHELVES,
  CHAIRS,
  CLOCK,
  COLUMNS,
  DESK,
  FLOOR_LAMPS,
  GLOBE,
  HALF_D,
  HALF_W,
  LADDER,
  PLANTS,
  RAILINGS,
  RAIL_HEIGHT,
  ROOM,
  RUGS,
  SIDE_TABLES,
  STAIRS,
  STAIR_RISE,
  STAIR_RUN,
  WAINSCOT_H,
} from "./layout";
import {
  makePaintingTexture,
  makeParquetTexture,
  makeRugTexture,
  makeWallTexture,
} from "./roomTextures";

// ---------------------------------------------------------------- материалы

const woodDark = new THREE.MeshStandardMaterial({ color: "#3d2413", roughness: 0.76 });
const woodMid = new THREE.MeshStandardMaterial({ color: "#5b3a20", roughness: 0.74 });
const woodLight = new THREE.MeshStandardMaterial({ color: "#7d5531", roughness: 0.7 });
const stoneMat = new THREE.MeshStandardMaterial({ color: "#6d6155", roughness: 0.9 });
const ceilingMat = new THREE.MeshStandardMaterial({ color: "#3a2e23", roughness: 1 });
const brassMat = new THREE.MeshStandardMaterial({
  color: "#c08f3e",
  roughness: 0.32,
  metalness: 0.8,
});
const ironMat = new THREE.MeshStandardMaterial({
  color: "#2e2a26",
  roughness: 0.5,
  metalness: 0.5,
});
const fabricRed = new THREE.MeshStandardMaterial({ color: "#6d2f27", roughness: 0.95 });
const fabricGreen = new THREE.MeshStandardMaterial({ color: "#2f4736", roughness: 0.95 });
const leatherMat = new THREE.MeshStandardMaterial({ color: "#4e3220", roughness: 0.8 });
const paperMat = new THREE.MeshStandardMaterial({ color: "#e6dabb", roughness: 0.95 });
const leafMat = new THREE.MeshStandardMaterial({ color: "#2f5c37", roughness: 0.9 });
const leafMat2 = new THREE.MeshStandardMaterial({ color: "#3c7044", roughness: 0.9 });
const potMat = new THREE.MeshStandardMaterial({ color: "#7c4a31", roughness: 0.85 });
const globeMat = new THREE.MeshStandardMaterial({ color: "#3f6f8c", roughness: 0.6 });
const glassMat = new THREE.MeshStandardMaterial({
  color: "#cfe3f2",
  emissive: "#b9d7ee",
  emissiveIntensity: 1.15,
  roughness: 0.25,
});
const shadeWarm = new THREE.MeshStandardMaterial({
  color: "#ffd9a0",
  emissive: "#ffb066",
  emissiveIntensity: 1.1,
  roughness: 0.6,
});
const shadeGreen = new THREE.MeshStandardMaterial({
  color: "#2c5c3f",
  emissive: "#7fe0a8",
  emissiveIntensity: 0.25,
  roughness: 0.6,
});
const candleMat = new THREE.MeshStandardMaterial({
  color: "#fff0d0",
  emissive: "#ffc477",
  emissiveIntensity: 1.6,
});

// ---------------------------------------------------------------- элементы

function Column({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.17, 0]} material={woodDark}>
        <boxGeometry args={[0.86, 0.34, 0.86]} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, BALCONY_Y / 2 + 0.1, 0]}
        material={woodMid}
      >
        <cylinderGeometry args={[0.26, 0.3, BALCONY_Y - 0.65, 14]} />
      </mesh>
      <mesh castShadow position={[0, BALCONY_Y - 0.17, 0]} material={woodDark}>
        <boxGeometry args={[0.78, 0.34, 0.78]} />
      </mesh>
    </group>
  );
}

function Chair({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow position={[0, 0.46, 0]} material={woodMid}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]} material={leatherMat}>
        <boxGeometry args={[0.44, 0.05, 0.44]} />
      </mesh>
      <mesh castShadow position={[0, 0.82, -0.23]} material={woodMid}>
        <boxGeometry args={[0.48, 0.66, 0.06]} />
      </mesh>
      {[
        [-0.2, -0.2],
        [0.2, -0.2],
        [-0.2, 0.2],
        [0.2, 0.2],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.23, z]} material={woodDark}>
          <boxGeometry args={[0.055, 0.46, 0.055]} />
        </mesh>
      ))}
    </group>
  );
}

function Armchair({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.34, 0]} material={fabricRed}>
        <boxGeometry args={[1.05, 0.42, 1.0]} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]} material={fabricRed}>
        <boxGeometry args={[0.92, 0.18, 0.88]} />
      </mesh>
      <mesh castShadow position={[0, 0.85, -0.45]} material={fabricRed}>
        <boxGeometry args={[1.05, 1.02, 0.2]} />
      </mesh>
      <mesh castShadow position={[-0.48, 0.66, -0.03]} material={fabricRed}>
        <boxGeometry args={[0.18, 0.36, 0.95]} />
      </mesh>
      <mesh castShadow position={[0.48, 0.66, -0.03]} material={fabricRed}>
        <boxGeometry args={[0.18, 0.36, 0.95]} />
      </mesh>
      {[
        [-0.42, -0.4],
        [0.42, -0.4],
        [-0.42, 0.4],
        [0.42, 0.4],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.07, z]} material={woodDark}>
          <boxGeometry args={[0.1, 0.14, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

function SideTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.58, 0]} material={woodMid}>
        <cylinderGeometry args={[0.36, 0.36, 0.05, 18]} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]} material={woodDark}>
        <cylinderGeometry args={[0.06, 0.08, 0.56, 10]} />
      </mesh>
      <mesh castShadow position={[0, 0.03, 0]} material={woodDark}>
        <cylinderGeometry args={[0.26, 0.28, 0.06, 14]} />
      </mesh>
      {/* чашка */}
      <mesh castShadow position={[0.1, 0.66, 0.05]} material={paperMat}>
        <cylinderGeometry args={[0.05, 0.04, 0.1, 12]} />
      </mesh>
      {/* пара книг */}
      <mesh castShadow position={[-0.1, 0.63, -0.04]} material={fabricGreen}>
        <boxGeometry args={[0.24, 0.045, 0.17]} />
      </mesh>
      <mesh castShadow position={[-0.11, 0.675, -0.05]} material={leatherMat}>
        <boxGeometry args={[0.22, 0.04, 0.16]} />
      </mesh>
    </group>
  );
}

function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.04, 0]} material={ironMat}>
        <cylinderGeometry args={[0.24, 0.28, 0.08, 18]} />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0]} material={brassMat}>
        <cylinderGeometry args={[0.025, 0.025, 1.7, 10]} />
      </mesh>
      <mesh position={[0, 1.82, 0]} material={shadeWarm}>
        <cylinderGeometry args={[0.2, 0.32, 0.4, 20, 1, true]} />
      </mesh>
      <pointLight
        position={[0, 1.74, 0]}
        color="#ffb066"
        intensity={16}
        distance={11}
        decay={1.7}
      />
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.24, 0]} material={potMat}>
        <cylinderGeometry args={[0.3, 0.24, 0.48, 16]} />
      </mesh>
      <mesh position={[0, 0.49, 0]} material={woodDark}>
        <cylinderGeometry args={[0.31, 0.31, 0.05, 16]} />
      </mesh>
      <mesh castShadow position={[0, 0.78, 0]} material={leafMat}>
        <coneGeometry args={[0.42, 0.72, 8]} />
      </mesh>
      <mesh castShadow position={[0.12, 1.08, -0.06]} material={leafMat2}>
        <coneGeometry args={[0.32, 0.6, 7]} />
      </mesh>
      <mesh castShadow position={[-0.1, 1.28, 0.08]} material={leafMat}>
        <coneGeometry args={[0.24, 0.5, 6]} />
      </mesh>
    </group>
  );
}

function Globe({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.06, 0]} material={woodDark}>
        <cylinderGeometry args={[0.3, 0.34, 0.12, 14]} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]} material={woodMid}>
        <cylinderGeometry args={[0.05, 0.07, 0.62, 10]} />
      </mesh>
      <mesh castShadow position={[0, 0.94, 0]} material={globeMat}>
        <sphereGeometry args={[0.32, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.94, 0]} rotation={[0.4, 0, 0]} material={brassMat}>
        <torusGeometry args={[0.36, 0.018, 8, 28]} />
      </mesh>
    </group>
  );
}

function GrandClock({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      <mesh castShadow receiveShadow position={[0, 1.1, 0]} material={woodDark}>
        <boxGeometry args={[0.62, 2.2, 0.36]} />
      </mesh>
      <mesh position={[0, 1.78, 0.19]} material={paperMat}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 20]} />
      </mesh>
      <mesh position={[0, 1.84, 0.21]} material={ironMat}>
        <boxGeometry args={[0.02, 0.12, 0.01]} />
      </mesh>
      <mesh position={[0.06, 1.78, 0.21]} material={ironMat}>
        <boxGeometry args={[0.1, 0.02, 0.01]} />
      </mesh>
      <mesh position={[0, 0.95, 0.19]} material={brassMat}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
      </mesh>
      <mesh castShadow position={[0, 2.28, 0]} material={woodMid}>
        <boxGeometry args={[0.74, 0.18, 0.44]} />
      </mesh>
    </group>
  );
}

function RollingLadder({ position }: { position: [number, number, number] }) {
  const rungs = [0.4, 0.75, 1.1, 1.45, 1.8, 2.15];
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      <group rotation={[-0.16, 0, 0]}>
        <mesh castShadow position={[-0.28, 1.3, 0]} material={woodMid}>
          <boxGeometry args={[0.07, 2.6, 0.07]} />
        </mesh>
        <mesh castShadow position={[0.28, 1.3, 0]} material={woodMid}>
          <boxGeometry args={[0.07, 2.6, 0.07]} />
        </mesh>
        {rungs.map((y) => (
          <mesh key={y} castShadow position={[0, y, 0]} material={woodLight}>
            <boxGeometry args={[0.56, 0.05, 0.1]} />
          </mesh>
        ))}
      </group>
      <mesh position={[-0.28, 0.07, 0.12]} material={ironMat}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} />
      </mesh>
      <mesh position={[0.28, 0.07, 0.12]} material={ironMat}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} />
      </mesh>
    </group>
  );
}

function Sconce({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={brassMat} position={[0, 0, 0.06]}>
        <boxGeometry args={[0.1, 0.34, 0.06]} />
      </mesh>
      <mesh material={brassMat} position={[0, 0.06, 0.18]}>
        <boxGeometry args={[0.05, 0.05, 0.22]} />
      </mesh>
      <mesh material={shadeWarm} position={[0, 0.16, 0.3]}>
        <cylinderGeometry args={[0.11, 0.16, 0.2, 14, 1, true]} />
      </mesh>
      <mesh material={candleMat} position={[0, 0.14, 0.3]}>
        <sphereGeometry args={[0.07, 10, 8]} />
      </mesh>
    </group>
  );
}

interface WindowProps {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
}

function TallWindow({ position, rotationY, width, height }: WindowProps) {
  const cols = Math.max(2, Math.round(width / 0.9));
  const rowsN = Math.max(2, Math.round(height / 1.1));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* стекло */}
      <mesh position={[0, 0, 0.02]} material={glassMat}>
        <boxGeometry args={[width, height, 0.04]} />
      </mesh>
      {/* рама */}
      <mesh castShadow position={[0, height / 2 + 0.08, 0.06]} material={woodDark}>
        <boxGeometry args={[width + 0.34, 0.16, 0.16]} />
      </mesh>
      <mesh castShadow position={[0, -height / 2 - 0.08, 0.06]} material={woodDark}>
        <boxGeometry args={[width + 0.34, 0.16, 0.2]} />
      </mesh>
      <mesh castShadow position={[-width / 2 - 0.09, 0, 0.06]} material={woodDark}>
        <boxGeometry args={[0.18, height + 0.32, 0.16]} />
      </mesh>
      <mesh castShadow position={[width / 2 + 0.09, 0, 0.06]} material={woodDark}>
        <boxGeometry args={[0.18, height + 0.32, 0.16]} />
      </mesh>
      {/* переплёт */}
      {Array.from({ length: cols - 1 }, (_, i) => (
        <mesh
          key={`c${i}`}
          position={[-width / 2 + (width / cols) * (i + 1), 0, 0.06]}
          material={woodDark}
        >
          <boxGeometry args={[0.06, height, 0.08]} />
        </mesh>
      ))}
      {Array.from({ length: rowsN - 1 }, (_, i) => (
        <mesh
          key={`r${i}`}
          position={[0, -height / 2 + (height / rowsN) * (i + 1), 0.06]}
          material={woodDark}
        >
          <boxGeometry args={[width, 0.06, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

function Painting({
  position,
  rotationY,
  width,
  height,
  texture,
}: {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  texture: THREE.Texture;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow material={woodDark}>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.05]} material={brassMat}>
        <boxGeometry args={[width + 0.06, height + 0.06, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- комната

export default function LibraryRoom() {
  // ---- процедурные текстуры ----
  const tex = useMemo(
    () => ({
      floor: makeParquetTexture(),
      wall: makeWallTexture(),
      rug0: makeRugTexture("#7a2f26", "#d9b87a"),
      rug1: makeRugTexture("#2f4a3d", "#c9a96b"),
      paintings: [0, 1, 2, 3].map((i) => makePaintingTexture(i + 1)),
    }),
    [],
  );

  useEffect(
    () => () => {
      tex.floor.dispose();
      tex.wall.dispose();
      tex.rug0.dispose();
      tex.rug1.dispose();
      tex.paintings.forEach((t) => t.dispose());
    },
    [tex],
  );

  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.floor, roughness: 0.66 }),
    [tex],
  );
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.wall, roughness: 0.96 }),
    [tex],
  );
  const rugMats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ map: tex.rug0, roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: tex.rug1, roughness: 1 }),
    ],
    [tex],
  );

  useEffect(
    () => () => {
      floorMat.dispose();
      wallMat.dispose();
      rugMats.forEach((m) => m.dispose());
    },
    [floorMat, wallMat, rugMats],
  );

  // ---- ступени лестницы ----
  const steps = useMemo<BoxInstance[]>(() => {
    const out: BoxInstance[] = [];
    const cx = (STAIRS.minX + STAIRS.maxX) / 2;
    const w = STAIRS.maxX - STAIRS.minX;
    for (let i = 1; i <= STAIRS.steps; i++) {
      const top = i * STAIR_RISE;
      out.push({
        position: [
          cx,
          top / 2,
          STAIRS.zBottom - (i - 0.5) * STAIR_RUN,
        ],
        scale: [w, top, STAIR_RUN],
      });
    }
    return out;
  }, []);

  // ---- балясины перил ----
  const balusters = useMemo<BoxInstance[]>(() => {
    const out: BoxInstance[] = [];
    const h = RAIL_HEIGHT - 0.24;
    for (const r of RAILINGS) {
      const dx = r.x2 - r.x1;
      const dz = r.z2 - r.z1;
      const len = Math.hypot(dx, dz);
      const n = Math.max(1, Math.round(len / 0.3));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        out.push({
          position: [r.x1 + dx * t, r.y + 0.1 + h / 2, r.z1 + dz * t],
          scale: [0.07, h, 0.07],
        });
      }
    }
    return out;
  }, []);

  // ---- потолочные балки ----
  const beams = useMemo<BoxInstance[]>(() => {
    const out: BoxInstance[] = [];
    const y = ROOM.height - 0.26;
    for (let z = -HALF_D + 1.6; z <= HALF_D - 1.6; z += 2.9) {
      out.push({ position: [0, y, z], scale: [ROOM.width, 0.46, 0.38] });
    }
    for (const x of [-9, 0, 9]) {
      out.push({
        position: [x, y - 0.06, 0],
        scale: [0.34, 0.34, ROOM.depth],
      });
    }
    return out;
  }, []);

  // ---- перила: поручни ----
  const rails = useMemo<BoxInstance[]>(() => {
    const out: BoxInstance[] = [];
    for (const r of RAILINGS) {
      const dx = r.x2 - r.x1;
      const dz = r.z2 - r.z1;
      const len = Math.hypot(dx, dz);
      const horizontal = Math.abs(dx) > Math.abs(dz);
      const cx = (r.x1 + r.x2) / 2;
      const cz = (r.z1 + r.z2) / 2;
      const scaleTop: [number, number, number] = horizontal
        ? [len, 0.12, 0.2]
        : [0.2, 0.12, len];
      const scaleBottom: [number, number, number] = horizontal
        ? [len, 0.1, 0.16]
        : [0.16, 0.1, len];
      out.push({ position: [cx, r.y + RAIL_HEIGHT - 0.06, cz], scale: scaleTop });
      out.push({ position: [cx, r.y + 0.1, cz], scale: scaleBottom });
    }
    return out;
  }, []);

  const balconyLen = ROOM.depth;
  const stairAngle = Math.atan2(
    STAIRS.top,
    STAIRS.zBottom - STAIRS.zTop,
  );
  const stairLen = Math.hypot(STAIRS.top, STAIRS.zBottom - STAIRS.zTop);

  return (
    <group>
      {/* ------------------------------------------------ пол */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
      </mesh>

      {/* декоративный медальон у входа */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[2, 0.008, 8.6]}
        material={woodDark}
      >
        <circleGeometry args={[2.6, 44]} />
      </mesh>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[2, 0.011, 8.6]}
        material={woodLight}
      >
        <circleGeometry args={[1.9, 44]} />
      </mesh>

      {/* ковры */}
      {RUGS.map((r, i) => (
        <mesh
          key={i}
          receiveShadow
          rotation={[-Math.PI / 2, 0, r.rotationY]}
          position={r.position}
          material={rugMats[r.variant]}
        >
          <planeGeometry args={r.size} />
        </mesh>
      ))}

      {/* ------------------------------------------------ потолок */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, ROOM.height, 0]}
        material={ceilingMat}
      >
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
      </mesh>
      <InstancedBoxes items={beams} material={woodDark} castShadow />

      {/* ------------------------------------------------ стены */}
      <mesh receiveShadow position={[0, ROOM.height / 2, -HALF_D]} material={wallMat}>
        <planeGeometry args={[ROOM.width, ROOM.height]} />
      </mesh>
      <mesh
        receiveShadow
        position={[0, ROOM.height / 2, HALF_D]}
        rotation={[0, Math.PI, 0]}
        material={wallMat}
      >
        <planeGeometry args={[ROOM.width, ROOM.height]} />
      </mesh>
      <mesh
        receiveShadow
        position={[-HALF_W, ROOM.height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={wallMat}
      >
        <planeGeometry args={[ROOM.depth, ROOM.height]} />
      </mesh>
      <mesh
        receiveShadow
        position={[HALF_W, ROOM.height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={wallMat}
      >
        <planeGeometry args={[ROOM.depth, ROOM.height]} />
      </mesh>

      {/* панели-буазери по низу стен */}
      <mesh position={[0, WAINSCOT_H / 2, HALF_D - 0.06]} material={woodDark}>
        <boxGeometry args={[ROOM.width, WAINSCOT_H, 0.12]} />
      </mesh>
      <mesh position={[-HALF_W + 0.06, WAINSCOT_H / 2, 0]} material={woodDark}>
        <boxGeometry args={[0.12, WAINSCOT_H, ROOM.depth]} />
      </mesh>
      <mesh position={[HALF_W - 0.06, WAINSCOT_H / 2, 0]} material={woodDark}>
        <boxGeometry args={[0.12, WAINSCOT_H, ROOM.depth]} />
      </mesh>

      {/* карниз под потолком */}
      <mesh position={[0, ROOM.height - 0.55, HALF_D - 0.12]} material={woodMid}>
        <boxGeometry args={[ROOM.width, 0.2, 0.24]} />
      </mesh>
      <mesh position={[0, ROOM.height - 0.55, -HALF_D + 0.12]} material={woodMid}>
        <boxGeometry args={[ROOM.width, 0.2, 0.24]} />
      </mesh>
      <mesh position={[-HALF_W + 0.12, ROOM.height - 0.55, 0]} material={woodMid}>
        <boxGeometry args={[0.24, 0.2, ROOM.depth]} />
      </mesh>
      <mesh position={[HALF_W - 0.12, ROOM.height - 0.55, 0]} material={woodMid}>
        <boxGeometry args={[0.24, 0.2, ROOM.depth]} />
      </mesh>

      {/* ------------------------------------------------ окна */}
      {[-8, 0, 8].map((x) => (
        <TallWindow
          key={`fw${x}`}
          position={[x, 3.5, HALF_D - 0.08]}
          rotationY={Math.PI}
          width={2.9}
          height={5}
        />
      ))}
      {[-4, 2, 8].map((z) => (
        <TallWindow
          key={`rw${z}`}
          position={[HALF_W - 0.08, 6.3, z]}
          rotationY={-Math.PI / 2}
          width={2.4}
          height={2.4}
        />
      ))}
      {[-4, 2, 8].map((z) => (
        <TallWindow
          key={`lw${z}`}
          position={[-HALF_W + 0.08, 6.3, z]}
          rotationY={Math.PI / 2}
          width={2.4}
          height={2.4}
        />
      ))}

      {/* ------------------------------------------------ галерея */}
      {/* перекрытия */}
      <mesh
        receiveShadow
        castShadow
        position={[0, BALCONY_Y - BALCONY_SLAB / 2, -HALF_D + BALCONY_DEPTH / 2]}
        material={woodMid}
      >
        <boxGeometry args={[ROOM.width, BALCONY_SLAB, BALCONY_DEPTH]} />
      </mesh>
      <mesh
        receiveShadow
        castShadow
        position={[-HALF_W + BALCONY_DEPTH / 2, BALCONY_Y - BALCONY_SLAB / 2, 0]}
        material={woodMid}
      >
        <boxGeometry args={[BALCONY_DEPTH, BALCONY_SLAB, balconyLen]} />
      </mesh>
      <mesh
        receiveShadow
        castShadow
        position={[HALF_W - BALCONY_DEPTH / 2, BALCONY_Y - BALCONY_SLAB / 2, 0]}
        material={woodMid}
      >
        <boxGeometry args={[BALCONY_DEPTH, BALCONY_SLAB, balconyLen]} />
      </mesh>

      {/* фриз по краю галереи */}
      <mesh position={[0, BALCONY_Y - BALCONY_SLAB / 2, -10]} material={woodDark}>
        <boxGeometry args={[ROOM.width, BALCONY_SLAB + 0.1, 0.16]} />
      </mesh>
      <mesh position={[-14, BALCONY_Y - BALCONY_SLAB / 2, 1.45]} material={woodDark}>
        <boxGeometry args={[0.16, BALCONY_SLAB + 0.1, 23]} />
      </mesh>
      <mesh position={[14, BALCONY_Y - BALCONY_SLAB / 2, 1.45]} material={woodDark}>
        <boxGeometry args={[0.16, BALCONY_SLAB + 0.1, 23]} />
      </mesh>

      {/* перила */}
      <InstancedBoxes items={rails} material={woodDark} castShadow />
      <InstancedBoxes items={balusters} material={woodMid} castShadow />

      {/* колонны */}
      {COLUMNS.map(([x, z], i) => (
        <Column key={i} position={[x, 0, z]} />
      ))}

      {/* ------------------------------------------------ лестница */}
      <InstancedBoxes items={steps} material={woodMid} castShadow receiveShadow />
      {[STAIRS.minX - 0.14, STAIRS.maxX + 0.14].map((x) => (
        <group key={x}>
          {/* косоур */}
          <mesh
            castShadow
            receiveShadow
            position={[
              x,
              STAIRS.top / 2,
              (STAIRS.zBottom + STAIRS.zTop) / 2,
            ]}
            rotation={[stairAngle, 0, 0]}
            material={woodDark}
          >
            <boxGeometry args={[0.28, 0.5, stairLen]} />
          </mesh>
          {/* поручень */}
          <mesh
            castShadow
            position={[
              x,
              STAIRS.top / 2 + 0.95,
              (STAIRS.zBottom + STAIRS.zTop) / 2,
            ]}
            rotation={[stairAngle, 0, 0]}
            material={woodMid}
          >
            <boxGeometry args={[0.16, 0.12, stairLen]} />
          </mesh>
        </group>
      ))}
      {/* стойки начала лестницы */}
      {[STAIRS.minX - 0.14, STAIRS.maxX + 0.14].map((x) => (
        <mesh key={`p${x}`} castShadow position={[x, 0.6, STAIRS.zBottom]} material={woodDark}>
          <boxGeometry args={[0.28, 1.2, 0.28]} />
        </mesh>
      ))}

      {/* ------------------------------------------------ шкафы */}
      {BOOKSHELVES.map((s, i) => (
        <Bookshelf key={i} placement={s} />
      ))}

      {/* ------------------------------------------------ центральный стол */}
      <group position={DESK.position}>
        <mesh
          castShadow
          receiveShadow
          position={[0, DESK.size[1], 0]}
          material={woodMid}
        >
          <boxGeometry args={[DESK.size[0], 0.09, DESK.size[2]]} />
        </mesh>
        <mesh position={[0, DESK.size[1] - 0.09, 0]} material={fabricGreen}>
          <boxGeometry args={[DESK.size[0] - 0.3, 0.02, DESK.size[2] - 0.25]} />
        </mesh>
        {[
          [-2.4, 0.66],
          [2.4, 0.66],
          [-2.4, -0.66],
          [2.4, -0.66],
        ].map(([x, z], i) => (
          <mesh
            key={i}
            castShadow
            position={[x, DESK.size[1] / 2, z]}
            material={woodDark}
          >
            <boxGeometry args={[0.16, DESK.size[1], 0.16]} />
          </mesh>
        ))}

        {/* настольная лампа с зелёным абажуром */}
        <group position={[-1.9, DESK.size[1] + 0.05, -0.2]}>
          <mesh castShadow material={brassMat} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.04, 14]} />
          </mesh>
          <mesh material={brassMat} position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.36, 8]} />
          </mesh>
          <mesh material={shadeGreen} position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 0.16, 18, 1, true]} />
          </mesh>
          <mesh material={candleMat} position={[0, 0.36, 0]}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
          <pointLight
            position={[0, 0.3, 0]}
            color="#ffc98a"
            intensity={9}
            distance={7}
            decay={1.8}
          />
        </group>

        {/* открытая книга */}
        <group position={[0.35, DESK.size[1] + 0.06, 0.05]}>
          <mesh castShadow rotation={[0, 0.1, -0.06]} material={paperMat}>
            <boxGeometry args={[0.34, 0.03, 0.26]} />
          </mesh>
          <mesh
            castShadow
            position={[0.34, 0.002, 0.008]}
            rotation={[0, 0.1, 0.06]}
            material={paperMat}
          >
            <boxGeometry args={[0.34, 0.03, 0.26]} />
          </mesh>
          <mesh position={[0.17, -0.02, 0]} material={leatherMat}>
            <boxGeometry args={[0.72, 0.02, 0.29]} />
          </mesh>
        </group>

        {/* стопка книг */}
        <group position={[1.7, DESK.size[1] + 0.05, -0.3]}>
          <mesh castShadow material={fabricRed}>
            <boxGeometry args={[0.3, 0.06, 0.22]} />
          </mesh>
          <mesh castShadow position={[0.015, 0.055, 0.01]} rotation={[0, 0.14, 0]} material={fabricGreen}>
            <boxGeometry args={[0.28, 0.05, 0.2]} />
          </mesh>
          <mesh castShadow position={[-0.01, 0.1, -0.01]} material={leatherMat}>
            <boxGeometry args={[0.26, 0.045, 0.19]} />
          </mesh>
        </group>

        {/* бумаги, чернильница и перо */}
        <mesh
          position={[-0.9, DESK.size[1] + 0.035, 0.3]}
          rotation={[-Math.PI / 2, 0, 0.2]}
          material={paperMat}
        >
          <planeGeometry args={[0.3, 0.4]} />
        </mesh>
        <mesh
          position={[-0.75, DESK.size[1] + 0.037, 0.24]}
          rotation={[-Math.PI / 2, 0, -0.1]}
          material={paperMat}
        >
          <planeGeometry args={[0.3, 0.4]} />
        </mesh>
        <mesh castShadow position={[-0.35, DESK.size[1] + 0.09, -0.45]} material={ironMat}>
          <cylinderGeometry args={[0.06, 0.07, 0.1, 12]} />
        </mesh>
        <mesh
          position={[-0.33, DESK.size[1] + 0.22, -0.43]}
          rotation={[0, 0, 0.5]}
          material={paperMat}
        >
          <coneGeometry args={[0.018, 0.3, 6]} />
        </mesh>
        {/* очки */}
        <group position={[1.0, DESK.size[1] + 0.06, 0.45]} rotation={[0, 0.3, 0]}>
          <mesh material={brassMat} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.05, 0.008, 6, 16]} />
          </mesh>
          <mesh position={[0.12, 0, 0]} material={brassMat} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.05, 0.008, 6, 16]} />
          </mesh>
          <mesh position={[0.06, 0, 0]} material={brassMat}>
            <boxGeometry args={[0.04, 0.008, 0.008]} />
          </mesh>
        </group>
      </group>

      {/* стулья */}
      {CHAIRS.map((c, i) => (
        <Chair key={i} position={c.position} rotationY={c.rotationY} />
      ))}

      {/* ------------------------------------------------ зоны отдыха */}
      {ARMCHAIRS.map((a, i) => (
        <Armchair key={i} position={a.position} rotationY={a.rotationY} />
      ))}
      {SIDE_TABLES.map((p, i) => (
        <SideTable key={i} position={p} />
      ))}
      {FLOOR_LAMPS.map((p, i) => (
        <FloorLamp key={i} position={p} />
      ))}
      {PLANTS.map((p, i) => (
        <Plant key={i} position={p} />
      ))}

      <Globe position={GLOBE} />
      <GrandClock position={CLOCK} />
      <RollingLadder position={LADDER} />

      {/* ------------------------------------------------ люстра */}
      <group position={[2, 6.15, 0.6]}>
        <mesh material={ironMat} position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
        </mesh>
        <mesh material={brassMat}>
          <torusGeometry args={[1.05, 0.05, 8, 30]} />
        </mesh>
        <mesh material={brassMat} position={[0, 0.45, 0]}>
          <torusGeometry args={[0.6, 0.04, 8, 24]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 1.05, 0.12, Math.sin(a) * 1.05]}>
              <mesh material={brassMat}>
                <cylinderGeometry args={[0.035, 0.035, 0.24, 8]} />
              </mesh>
              <mesh material={candleMat} position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.09, 10, 8]} />
              </mesh>
            </group>
          );
        })}
        <pointLight
          position={[0, 0.2, 0]}
          color="#ffcf9a"
          intensity={70}
          distance={26}
          decay={1.5}
        />
      </group>

      {/* малые люстры над крыльями */}
      {[
        [-10.5, 0.6],
        [10.5, -5.5],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 6.6, z]}>
          <mesh material={ironMat} position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.7, 8]} />
          </mesh>
          <mesh material={brassMat}>
            <torusGeometry args={[0.6, 0.04, 8, 24]} />
          </mesh>
          {Array.from({ length: 5 }, (_, j) => {
            const a = (j / 5) * Math.PI * 2;
            return (
              <mesh
                key={j}
                material={candleMat}
                position={[Math.cos(a) * 0.6, 0.16, Math.sin(a) * 0.6]}
              >
                <sphereGeometry args={[0.08, 8, 8]} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* ------------------------------------------------ бра на колоннах */}
      {[
        { position: [-14, 2.6, -5] as [number, number, number], rotationY: Math.PI / 2 },
        { position: [-14, 2.6, 5] as [number, number, number], rotationY: Math.PI / 2 },
        { position: [14, 2.6, -5] as [number, number, number], rotationY: -Math.PI / 2 },
        { position: [14, 2.6, 5] as [number, number, number], rotationY: -Math.PI / 2 },
        { position: [-8, 2.6, -10] as [number, number, number], rotationY: 0 },
        { position: [4, 2.6, -10] as [number, number, number], rotationY: 0 },
      ].map((s, i) => (
        <Sconce key={i} position={s.position} rotationY={s.rotationY} />
      ))}

      {/* ------------------------------------------------ картины */}
      <Painting
        position={[-4.3, 3.6, HALF_D - 0.14]}
        rotationY={Math.PI}
        width={1.5}
        height={1.1}
        texture={tex.paintings[0]}
      />
      <Painting
        position={[4.3, 3.6, HALF_D - 0.14]}
        rotationY={Math.PI}
        width={1.5}
        height={1.1}
        texture={tex.paintings[1]}
      />
      <Painting
        position={[10.6, 2.9, -HALF_D + 0.14]}
        rotationY={0}
        width={2.0}
        height={1.4}
        texture={tex.paintings[2]}
      />
      <Painting
        position={[HALF_W - 0.14, 2.5, 3.2]}
        rotationY={-Math.PI / 2}
        width={1.3}
        height={1.0}
        texture={tex.paintings[3]}
      />
    </group>
  );
}
