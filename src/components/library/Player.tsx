"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraState, inputState } from "./controls";
import {
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  STATIC_COLLIDERS,
  floorHeightAt,
} from "./layout";
import { isUiOpen, useLibraryStore } from "@/store/libraryStore";
import { playFootstep, playJump, playLand } from "@/lib/audio/sfx";
import HeldBookMesh from "./HeldBookMesh";

const WALK_SPEED = 3.4;
const RUN_SPEED = 6.4;
const JUMP_VELOCITY = 5.2;
const GRAVITY = 14;
const TURN_SPEED = 12;

// ---------- Пропорции Стива (Minecraft): 1 пиксель = S метров ----------
// Голова 8x8x8, тело 8x12x4, руки и ноги 4x12x4. Рост ~1.8 м.
const S = 0.055;
const HEAD = 8 * S; // 0.44
const BODY_W = 8 * S;
const BODY_H = 12 * S;
const BODY_D = 4 * S;
const LIMB_W = 4 * S;
const LIMB_H = 12 * S;
const LEG_TOP = LIMB_H; // уровень таза
const SHOULDER_Y = LEG_TOP + BODY_H; // уровень плеч

// ---------- Материалы Стива (создаются один раз) ----------
const skinMat = new THREE.MeshStandardMaterial({ color: "#c68e63", roughness: 0.85 });
const hairMat = new THREE.MeshStandardMaterial({ color: "#3b2a1e", roughness: 0.9 });
const shirtMat = new THREE.MeshStandardMaterial({ color: "#00a5a5", roughness: 0.85 });
const pantsMat = new THREE.MeshStandardMaterial({ color: "#4040a8", roughness: 0.85 });
const shoesMat = new THREE.MeshStandardMaterial({ color: "#5a5a5a", roughness: 0.8 });
const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
const eyeBlueMat = new THREE.MeshStandardMaterial({ color: "#3a2fc4", roughness: 0.6 });
const mouthMat = new THREE.MeshStandardMaterial({ color: "#8a5a3c", roughness: 0.9 });

// Круг игрока против объёмных AABB-коллайдеров.
// Препятствие игнорируется, если оно целиком выше головы
// или ниже ног — так галерея не мешает ходить под ней.
function collides(x: number, z: number, y: number): boolean {
  const top = y + PLAYER_HEIGHT;
  for (const c of STATIC_COLLIDERS) {
    if (top <= c.base + 0.1) continue;
    if (y >= c.height - 0.1) continue;
    const cx = Math.max(c.minX, Math.min(x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
}

function resetInput() {
  inputState.forward = false;
  inputState.back = false;
  inputState.left = false;
  inputState.right = false;
  inputState.run = false;
  inputState.jumpQueued = false;
}

const Player = forwardRef<THREE.Group>(function Player(_props, ref) {
  const group = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const heading = useRef(0);

  // Части тела Стива для процедурной анимации.
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  // Фаза шага и сглаженная амплитуда махов.
  const walkPhase = useRef(0);
  const swingAmp = useRef(0);
  const jumpPose = useRef(0);
  // Индекс последнего озвученного шага (каждые пол-периода фазы).
  const lastStep = useRef(0);

  // Книга, которую персонаж несёт в правой руке.
  const heldBook = useLibraryStore(
    (s) => s.books.find((b) => b.id === s.heldBookId) ?? null,
  );

  useImperativeHandle(ref, () => group.current as THREE.Group);

  useEffect(() => {
    const setKey = (code: string, value: boolean) => {
      switch (code) {
        case "KeyW":
        case "ArrowUp":
          inputState.forward = value;
          break;
        case "KeyS":
        case "ArrowDown":
          inputState.back = value;
          break;
        case "KeyA":
        case "ArrowLeft":
          inputState.left = value;
          break;
        case "KeyD":
        case "ArrowRight":
          inputState.right = value;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputState.run = value;
          break;
        case "Space":
          if (value) inputState.jumpQueued = true;
          break;
      }
    };
    const onDown = (e: KeyboardEvent) => {
      // пока открыт UI (модалка/панель книги), персонаж не двигается
      if (isUiOpen()) return;
      if (e.code === "Space") e.preventDefault();
      setKey(e.code, true);
    };
    const onUp = (e: KeyboardEvent) => setKey(e.code, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // «зажатые» клавиши сбрасываются при открытии UI
    if (isUiOpen()) resetInput();

    // в режиме от первого лица модель Стива скрыта
    if (model.current) {
      model.current.visible = cameraState.mode === "third";
    }

    // направление движения относительно камеры
    const f = (inputState.forward ? 1 : 0) - (inputState.back ? 1 : 0);
    const s = (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0);

    let moveX = 0;
    let moveZ = 0;
    if (f !== 0 || s !== 0) {
      const yaw = cameraState.yaw;
      const fwdX = -Math.sin(yaw);
      const fwdZ = -Math.cos(yaw);
      const rightX = -fwdZ;
      const rightZ = fwdX;
      moveX = fwdX * f + rightX * s;
      moveZ = fwdZ * f + rightZ * s;
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;
    }

    const running = inputState.run;
    const speed = running ? RUN_SPEED : WALK_SPEED;
    const isMoving = moveX !== 0 || moveZ !== 0;

    // поосевое разрешение коллизий -> скольжение вдоль препятствий
    const nextX = g.position.x + moveX * speed * dt;
    if (!collides(nextX, g.position.z, g.position.y)) g.position.x = nextX;
    const nextZ = g.position.z + moveZ * speed * dt;
    if (!collides(g.position.x, nextZ, g.position.y)) g.position.z = nextZ;

    // прыжок / гравитация
    if (inputState.jumpQueued) {
      if (grounded.current) {
        velocityY.current = JUMP_VELOCITY;
        grounded.current = false;
        playJump();
      }
      inputState.jumpQueued = false;
    }
    velocityY.current -= GRAVITY * dt;
    g.position.y += velocityY.current * dt;

    // поверхность под ногами: пол, ступени лестницы или галерея
    const support = floorHeightAt(g.position.x, g.position.z, g.position.y);
    if (g.position.y <= support) {
      // приземление озвучиваем только после реального падения
      if (!grounded.current && velocityY.current < -1.5) playLand();
      g.position.y = support;
      velocityY.current = 0;
      grounded.current = true;
    } else if (
      grounded.current &&
      velocityY.current <= 0 &&
      g.position.y - support <= 0.4
    ) {
      // плавный спуск по ступеням, без «подпрыгивания»
      g.position.y = support;
      velocityY.current = 0;
    } else {
      grounded.current = false;
    }

    // плавный поворот модели в сторону движения
    if (isMoving && model.current) {
      const target = Math.atan2(moveX, moveZ);
      let diff = target - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading.current += diff * Math.min(1, dt * TURN_SPEED);
      model.current.rotation.y = heading.current;
    }

    // ---------- Процедурная анимация Стива ----------
    const k = Math.min(1, dt * 10);
    const holding = useLibraryStore.getState().heldBookId !== null;

    // амплитуда махов плавно нарастает/затухает
    const targetAmp = isMoving ? (running ? 1.0 : 0.65) : 0;
    swingAmp.current += (targetAmp - swingAmp.current) * k;

    // фаза шага крутится пропорционально скорости
    if (isMoving) {
      walkPhase.current += dt * (running ? 11 : 7);
    }
    const swing = Math.sin(walkPhase.current) * swingAmp.current;

    // ---------- Звук шагов (синхронно с махом ног) ----------
    const stepIndex = Math.floor(walkPhase.current / Math.PI);
    if (isMoving && grounded.current) {
      if (stepIndex !== lastStep.current) {
        lastStep.current = stepIndex;
        playFootstep(running);
      }
    } else {
      lastStep.current = stepIndex;
    }

    // поза прыжка плавно включается в воздухе
    const targetJump = grounded.current ? 0 : 1;
    jumpPose.current += (targetJump - jumpPose.current) * Math.min(1, dt * 8);
    const jp = jumpPose.current;

    // лёгкое «дыхание» в покое
    const idleBreath = (1 - swingAmp.current) * Math.sin(t * 2.2) * 0.015;
    const idleSway = (1 - swingAmp.current) * Math.sin(t * 1.7) * 0.04;

    // ноги: мах в противофазе + поджатие в прыжке
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = swing * 0.9 * (1 - jp) + jp * 0.35;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -swing * 0.9 * (1 - jp) + jp * 0.5;
    }

    // левая рука: противофаза ногам + подъём в прыжке + idle-покачивание
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -swing * 0.85 * (1 - jp);
      leftArmRef.current.rotation.z = 0.04 + idleSway + jp * 2.4;
    }

    // правая рука: если несёт книгу — держит её перед собой,
    // иначе — обычный мах при ходьбе.
    if (rightArmRef.current) {
      if (holding) {
        const target = -1.15 + Math.sin(t * 1.8) * 0.03;
        rightArmRef.current.rotation.x +=
          (target - rightArmRef.current.rotation.x) * k;
        rightArmRef.current.rotation.z +=
          (-0.12 - rightArmRef.current.rotation.z) * k;
      } else {
        rightArmRef.current.rotation.x = swing * 0.85 * (1 - jp);
        rightArmRef.current.rotation.z = -0.04 - idleSway - jp * 2.4;
      }
    }

    // корпус: дыхание в покое, лёгкий наклон вперёд при беге
    if (bodyRef.current) {
      bodyRef.current.position.y = idleBreath;
      bodyRef.current.rotation.x = swingAmp.current * (running ? 0.09 : 0.04);
    }

    // голова: чуть покачивается при ходьбе
    if (headRef.current) {
      headRef.current.rotation.x =
        Math.sin(walkPhase.current * 2) * 0.05 * swingAmp.current + idleBreath;
      headRef.current.position.y = SHOULDER_Y + HEAD / 2 + idleBreath;
    }
  });

  return (
    <group ref={group} position={[0, 0, 9]}>
      {/* Minecraft Steve — процедурная модель из боксов.
          Вложенная группа `model` позволяет заменить его на GLB,
          не трогая систему управления. Лицо смотрит в +Z. */}
      <group ref={model}>
        {/* ---- Ноги (пивот на уровне таза) ---- */}
        <group ref={leftLegRef} position={[-LIMB_W / 2, LEG_TOP, 0]}>
          <mesh castShadow position={[0, -LIMB_H / 2 + LIMB_H * 0.125, 0]} material={pantsMat}>
            <boxGeometry args={[LIMB_W, LIMB_H * 0.75, LIMB_W]} />
          </mesh>
          <mesh castShadow position={[0, -LIMB_H + LIMB_H * 0.125, 0]} material={shoesMat}>
            <boxGeometry args={[LIMB_W, LIMB_H * 0.25, LIMB_W]} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[LIMB_W / 2, LEG_TOP, 0]}>
          <mesh castShadow position={[0, -LIMB_H / 2 + LIMB_H * 0.125, 0]} material={pantsMat}>
            <boxGeometry args={[LIMB_W, LIMB_H * 0.75, LIMB_W]} />
          </mesh>
          <mesh castShadow position={[0, -LIMB_H + LIMB_H * 0.125, 0]} material={shoesMat}>
            <boxGeometry args={[LIMB_W, LIMB_H * 0.25, LIMB_W]} />
          </mesh>
        </group>

        {/* ---- Корпус ---- */}
        <group ref={bodyRef}>
          <mesh castShadow position={[0, LEG_TOP + BODY_H / 2, 0]} material={shirtMat}>
            <boxGeometry args={[BODY_W, BODY_H, BODY_D]} />
          </mesh>

          {/* ---- Руки (пивот на уровне плеч) ---- */}
          <group ref={leftArmRef} position={[-(BODY_W / 2 + LIMB_W / 2), SHOULDER_Y - S, 0]}>
            {/* рукав футболки */}
            <mesh castShadow position={[0, -LIMB_H * 0.25 + S, 0]} material={shirtMat}>
              <boxGeometry args={[LIMB_W, LIMB_H * 0.5, LIMB_W]} />
            </mesh>
            {/* предплечье — кожа */}
            <mesh castShadow position={[0, -LIMB_H * 0.75 + S, 0]} material={skinMat}>
              <boxGeometry args={[LIMB_W, LIMB_H * 0.5, LIMB_W]} />
            </mesh>
          </group>
          <group ref={rightArmRef} position={[BODY_W / 2 + LIMB_W / 2, SHOULDER_Y - S, 0]}>
            <mesh castShadow position={[0, -LIMB_H * 0.25 + S, 0]} material={shirtMat}>
              <boxGeometry args={[LIMB_W, LIMB_H * 0.5, LIMB_W]} />
            </mesh>
            <mesh castShadow position={[0, -LIMB_H * 0.75 + S, 0]} material={skinMat}>
              <boxGeometry args={[LIMB_W, LIMB_H * 0.5, LIMB_W]} />
            </mesh>

            {/* книга в правой руке: компенсируем наклон руки, чтобы книга
                была почти вертикальной, обложкой вперёд */}
            {heldBook && (
              <group
                position={[0, -LIMB_H + S * 0.5, LIMB_W * 1.1]}
                rotation={[1.15, -Math.PI / 2, 0]}
              >
                <HeldBookMesh book={heldBook} />
              </group>
            )}
          </group>
        </group>

        {/* ---- Голова ---- */}
        <group ref={headRef} position={[0, SHOULDER_Y + HEAD / 2, 0]}>
          <mesh castShadow material={skinMat}>
            <boxGeometry args={[HEAD, HEAD, HEAD]} />
          </mesh>

          {/* волосы: шапка сверху + чёлка */}
          <mesh castShadow position={[0, HEAD / 2 - S, 0]} material={hairMat}>
            <boxGeometry args={[HEAD + S * 0.2, S * 2.05, HEAD + S * 0.2]} />
          </mesh>
          <mesh position={[0, HEAD / 2 - S * 2.5, HEAD / 2 + S * 0.06]} material={hairMat}>
            <boxGeometry args={[HEAD + S * 0.2, S, S * 0.2]} />
          </mesh>

          {/* глаза: белок + синий зрачок (лицо на +Z) */}
          <mesh position={[-S * 2, S * 0.5, HEAD / 2 + S * 0.05]} material={eyeWhiteMat}>
            <boxGeometry args={[S, S, S * 0.15]} />
          </mesh>
          <mesh position={[-S, S * 0.5, HEAD / 2 + S * 0.05]} material={eyeBlueMat}>
            <boxGeometry args={[S, S, S * 0.15]} />
          </mesh>
          <mesh position={[S * 2, S * 0.5, HEAD / 2 + S * 0.05]} material={eyeWhiteMat}>
            <boxGeometry args={[S, S, S * 0.15]} />
          </mesh>
          <mesh position={[S, S * 0.5, HEAD / 2 + S * 0.05]} material={eyeBlueMat}>
            <boxGeometry args={[S, S, S * 0.15]} />
          </mesh>

          {/* нос/рот */}
          <mesh position={[0, -S * 1.2, HEAD / 2 + S * 0.05]} material={mouthMat}>
            <boxGeometry args={[S, S, S * 0.15]} />
          </mesh>
          <mesh position={[0, -S * 2.6, HEAD / 2 + S * 0.05]} material={hairMat}>
            <boxGeometry args={[S * 2, S * 0.8, S * 0.15]} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

export default Player;
