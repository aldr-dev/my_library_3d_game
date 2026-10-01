"use client";

import { RefObject, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraState } from "./controls";
import { STATIC_COLLIDERS } from "./layout";
import { isUiOpen } from "@/store/libraryStore";

const MIN_PITCH = -0.25;
const MAX_PITCH = 1.15;
// от первого лица можно смотреть почти вертикально вверх/вниз
const FP_MIN_PITCH = -1.35;
const FP_MAX_PITCH = 1.35;
const MIN_DISTANCE = 1.6;
const MAX_DISTANCE = 9;
const MARGIN = 0.25;
const EYE_HEIGHT = 1.58; // уровень глаз Стива

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function isBlocked(x: number, y: number, z: number): boolean {
  if (y < 0.2) return true;
  for (const c of STATIC_COLLIDERS) {
    if (
      y > c.base + 0.05 &&
      y < c.height + MARGIN &&
      x > c.minX - MARGIN &&
      x < c.maxX + MARGIN &&
      z > c.minZ - MARGIN &&
      z < c.maxZ + MARGIN
    ) {
      return true;
    }
  }
  return false;
}

interface CameraControllerProps {
  targetRef: RefObject<THREE.Group | null>;
}

export default function CameraController({ targetRef }: CameraControllerProps) {
  const { camera, gl } = useThree();
  const pivot = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      const first = cameraState.mode === "first";
      cameraState.yaw -= e.movementX * 0.0028;
      cameraState.pitch = clamp(
        cameraState.pitch + e.movementY * 0.0022,
        first ? FP_MIN_PITCH : MIN_PITCH,
        first ? FP_MAX_PITCH : MAX_PITCH,
      );
    };
    const onWheel = (e: WheelEvent) => {
      if (cameraState.mode === "first") return;
      cameraState.distance = clamp(
        cameraState.distance + e.deltaY * 0.003,
        MIN_DISTANCE,
        MAX_DISTANCE,
      );
    };
    // V — переключение вида: третье лицо <-> первое лицо
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyV") return;
      if (isUiOpen()) return;
      cameraState.mode = cameraState.mode === "third" ? "first" : "third";
      // при возврате к третьему лицу возвращаем pitch в допустимый диапазон
      if (cameraState.mode === "third") {
        cameraState.pitch = clamp(cameraState.pitch, MIN_PITCH, MAX_PITCH);
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    gl.domElement.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      gl.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const target = targetRef.current;
    if (!target) return;

    const { yaw, pitch, distance } = cameraState;

    // ---------- Режим от первого лица ----------
    if (cameraState.mode === "first") {
      camera.position.set(
        target.position.x,
        target.position.y + EYE_HEIGHT,
        target.position.z,
      );
      const fx = -Math.sin(yaw) * Math.cos(pitch);
      const fy = -Math.sin(pitch);
      const fz = -Math.cos(yaw) * Math.cos(pitch);
      lookTarget.set(
        camera.position.x + fx,
        camera.position.y + fy,
        camera.position.z + fz,
      );
      camera.lookAt(lookTarget);
      return;
    }

    // ---------- Режим от третьего лица ----------
    pivot.set(target.position.x, target.position.y + 1.5, target.position.z);

    const dirX = Math.sin(yaw) * Math.cos(pitch);
    const dirY = Math.sin(pitch);
    const dirZ = Math.cos(yaw) * Math.cos(pitch);

    // Сокращаем дистанцию, если между игроком и камерой стена/мебель.
    let dist = distance;
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * distance;
      if (isBlocked(pivot.x + dirX * t, pivot.y + dirY * t, pivot.z + dirZ * t)) {
        dist = Math.max(MIN_DISTANCE * 0.5, t - 0.3);
        break;
      }
    }

    desired.set(
      pivot.x + dirX * dist,
      pivot.y + dirY * dist,
      pivot.z + dirZ * dist,
    );

    const lerp = 1 - Math.exp(-delta * 12);
    camera.position.lerp(desired, lerp);
    camera.lookAt(pivot);
  });

  return null;
}
