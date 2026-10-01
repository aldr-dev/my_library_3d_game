"use client";

// Руки от первого лица в стиле Minecraft: блочные руки Стива выходят
// из нижних углов экрана. Позиции считаются от frustum камеры, поэтому
// руки корректно видны при любом соотношении сторон.
//
// Если игрок несёт книгу — обе руки плавно сводятся к центру и держат
// её перед лицом обложкой к игроку.

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraState, inputState } from "./controls";
import { useLibraryStore } from "@/store/libraryStore";
import HeldBookMesh from "./HeldBookMesh";

// Руки рисуются поверх сцены, иначе они проваливаются в стены и полки.
export const ARMS_RENDER_ORDER = 20;

const skinMat = new THREE.MeshStandardMaterial({
  color: "#c68e63",
  roughness: 0.85,
  depthTest: false,
  depthWrite: false,
  emissive: new THREE.Color("#c68e63"),
  emissiveIntensity: 0.18,
});
const shirtMat = new THREE.MeshStandardMaterial({
  color: "#00a5a5",
  roughness: 0.85,
  depthTest: false,
  depthWrite: false,
  emissive: new THREE.Color("#00a5a5"),
  emissiveIntensity: 0.15,
});

const ARM_W = 0.1; // толщина руки (Стив — квадратные конечности)
const SLEEVE_L = 0.2; // рукав футболки
const FORE_L = 0.24; // предплечье + кисть
const REF_DIST = 0.24; // глубина плоскости, на которой «крепятся» руки

// Куда смещается книга в руках (локально к камере).
const BOOK_POS: [number, number, number] = [0, -0.06, -0.62];

function damp(current: number, target: number, k: number): number {
  return current + (target - current) * k;
}

export default function FirstPersonArms() {
  const group = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const bookGroup = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // 0 — свободные руки, 1 — руки держат книгу.
  const holdMix = useRef(0);
  // фаза шага и её амплитуда
  const walkPhase = useRef(0);
  const walkAmp = useRef(0);
  // короткий взмах при взятии/постановке книги
  const swing = useRef(0);

  const heldBook = useLibraryStore(
    (s) => s.books.find((b) => b.id === s.heldBookId) ?? null,
  );

  // взмах рукой в момент взятия/постановки книги
  const heldId = heldBook?.id ?? null;
  const prevHeld = useRef<string | null>(heldId);
  useEffect(() => {
    if (prevHeld.current !== heldId) {
      swing.current = 1;
      prevHeld.current = heldId;
    }
  }, [heldId]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const first = cameraState.mode === "first";
    g.visible = first;
    if (!first) return;

    const dt = Math.min(delta, 0.05);
    const k = Math.min(1, dt * 12);
    const t = state.clock.elapsedTime;

    // группа жёстко следует за камерой
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);

    // ---- размеры кадра на опорной глубине ----
    const cam = camera as THREE.PerspectiveCamera;
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5)) * REF_DIST;
    const halfW = halfH * cam.aspect;

    // ---- ходьба ----
    const moving =
      inputState.forward ||
      inputState.back ||
      inputState.left ||
      inputState.right;
    const running = inputState.run && moving;
    if (moving) walkPhase.current += dt * (running ? 11 : 7);
    walkAmp.current = damp(
      walkAmp.current,
      moving ? (running ? 1 : 0.6) : 0,
      Math.min(1, dt * 8),
    );

    const amp = walkAmp.current;
    const bobY = Math.sin(walkPhase.current * 2) * 0.016 * amp;
    const bobX = Math.cos(walkPhase.current) * 0.014 * amp;
    const armSwing = Math.sin(walkPhase.current) * 0.22 * amp;

    // «дыхание» в покое
    const idle = (1 - amp) * Math.sin(t * 1.8) * 0.012;

    // ---- взмах при взятии/постановке ----
    if (swing.current > 0) {
      swing.current = Math.max(0, swing.current - dt * 3.2);
    }
    const punch = Math.sin(swing.current * Math.PI) * 0.75;

    // ---- переход между «свободными руками» и «книгой в руках» ----
    holdMix.current = damp(holdMix.current, heldBook ? 1 : 0, k);
    const h = holdMix.current;

    // ---- правая рука ----
    if (rightArm.current) {
      const idleX = halfW * 0.95;
      const holdX = halfW * 0.75;
      const idleY = -halfH * 1.0;
      const holdY = -halfH * 0.95;

      rightArm.current.position.set(
        THREE.MathUtils.lerp(idleX, holdX, h) + bobX * (1 - h),
        THREE.MathUtils.lerp(idleY, holdY, h) + bobY + idle,
        -REF_DIST,
      );
      rightArm.current.rotation.set(
        THREE.MathUtils.lerp(0.1 + armSwing, 0.22, h) + punch,
        THREE.MathUtils.lerp(0.22, 0.18, h),
        THREE.MathUtils.lerp(0.1, 0.02, h),
      );
    }

    // ---- левая рука ----
    if (leftArm.current) {
      const idleX = -halfW * 0.95;
      const holdX = -halfW * 0.75;
      const idleY = -halfH * 1.0;
      const holdY = -halfH * 0.95;

      leftArm.current.position.set(
        THREE.MathUtils.lerp(idleX, holdX, h) - bobX * (1 - h),
        THREE.MathUtils.lerp(idleY, holdY, h) - bobY + idle,
        -REF_DIST,
      );
      leftArm.current.rotation.set(
        THREE.MathUtils.lerp(0.1 - armSwing, 0.22, h),
        THREE.MathUtils.lerp(-0.22, -0.18, h),
        THREE.MathUtils.lerp(-0.1, -0.02, h),
      );
    }

    // ---- книга между рук ----
    if (bookGroup.current) {
      bookGroup.current.visible = h > 0.02;
      bookGroup.current.position.set(
        BOOK_POS[0],
        BOOK_POS[1] + bobY + idle,
        // книга «выезжает» вперёд вместе с руками
        THREE.MathUtils.lerp(BOOK_POS[2] - 0.25, BOOK_POS[2], h),
      );
      bookGroup.current.rotation.x = 0.26 + bobY * 0.6;
      bookGroup.current.scale.setScalar(THREE.MathUtils.lerp(0.6, 1, h));
    }
  });

  return (
    <group ref={group} visible={false}>
      {/* ---- правая рука ---- */}
      <group ref={rightArm}>
        <mesh
          frustumCulled={false}
          renderOrder={ARMS_RENDER_ORDER}
          position={[0, 0, -SLEEVE_L / 2]}
          material={shirtMat}
        >
          <boxGeometry args={[ARM_W, ARM_W, SLEEVE_L]} />
        </mesh>
        <mesh
          frustumCulled={false}
          renderOrder={ARMS_RENDER_ORDER}
          position={[0, 0, -SLEEVE_L - FORE_L / 2]}
          material={skinMat}
        >
          <boxGeometry args={[ARM_W, ARM_W, FORE_L]} />
        </mesh>
      </group>

      {/* ---- левая рука ---- */}
      <group ref={leftArm}>
        <mesh
          frustumCulled={false}
          renderOrder={ARMS_RENDER_ORDER}
          position={[0, 0, -SLEEVE_L / 2]}
          material={shirtMat}
        >
          <boxGeometry args={[ARM_W, ARM_W, SLEEVE_L]} />
        </mesh>
        <mesh
          frustumCulled={false}
          renderOrder={ARMS_RENDER_ORDER}
          position={[0, 0, -SLEEVE_L - FORE_L / 2]}
          material={skinMat}
        >
          <boxGeometry args={[ARM_W, ARM_W, FORE_L]} />
        </mesh>
      </group>

      {/* ---- книга в руках ----
          Внешняя группа — наклон, внутренняя — разворот обложкой к игроку
          (обложка книги лежит на +X, корешок на +Z). */}
      <group ref={bookGroup} visible={false}>
        {heldBook && (
          <group rotation={[0, -Math.PI / 2, 0]}>
            <HeldBookMesh
              book={heldBook}
              width={0.05}
              height={0.26}
              depth={0.2}
              overlay
            />
          </group>
        )}
      </group>
    </group>
  );
}
