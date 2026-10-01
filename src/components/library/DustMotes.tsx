"use client";

// Едва заметные пылинки в воздухе — «живой» объём библиотеки.
// Один Points-объект, обновляется на CPU, стоит почти ничего.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALF_D, HALF_W, ROOM } from "./layout";

const COUNT = 320;
const TOP = ROOM.height - 1.2;

export default function DustMotes() {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds, geometry, material } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * (HALF_W - 1.5);
      positions[i * 3 + 1] = 0.4 + Math.random() * TOP;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * (HALF_D - 1.5);
      speeds[i] = 0.03 + Math.random() * 0.07;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: "#ffe2b8",
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    return { positions, speeds, geometry, material };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3;
      positions[j + 1] += speeds[i] * dt;
      positions[j] += Math.sin(t * 0.3 + i) * 0.004;
      positions[j + 2] += Math.cos(t * 0.24 + i * 1.7) * 0.004;
      if (positions[j + 1] > TOP) {
        positions[j + 1] = 0.3;
        positions[j] = (Math.random() * 2 - 1) * (HALF_W - 1.5);
        positions[j + 2] = (Math.random() * 2 - 1) * (HALF_D - 1.5);
      }
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} args={[geometry, material]} frustumCulled={false} />;
}
