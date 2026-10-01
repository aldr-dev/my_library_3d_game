"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import LibraryRoom from "./LibraryRoom";
import Player from "./Player";
import CameraController from "./CameraController";
import BooksOnShelves from "./BooksOnShelves";
import DecorBooks from "./DecorBooks";
import DustMotes from "./DustMotes";
import InteractionSystem from "./InteractionSystem";
import FirstPersonArms from "./FirstPersonArms";
import { computeBookSlots } from "./shelfLayout";
import { useLibraryStore } from "@/store/libraryStore";

export default function LibraryScene() {
  const playerRef = useRef<THREE.Group>(null);
  const books = useLibraryStore((s) => s.books);
  const slots = useMemo(() => computeBookSlots(books), [books]);

  return (
    <>
      <color attach="background" args={["#14100c"]} />
      <fog attach="fog" args={["#18120c", 26, 76]} />

      {/* общий мягкий свет помещения */}
      <ambientLight color="#ffe8cc" intensity={0.5} />
      <hemisphereLight
        color="#ffe3bd"
        groundColor="#3a2a1c"
        intensity={0.55}
      />

      {/* солнечный свет из высоких окон */}
      <directionalLight
        position={[12, 18, 28]}
        color="#fff2dc"
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
      />

      <LibraryRoom />
      <DecorBooks slots={slots} />
      <BooksOnShelves slots={slots} />
      <DustMotes />
      <Player ref={playerRef} />
      <CameraController targetRef={playerRef} />
      <InteractionSystem slots={slots} playerRef={playerRef} />
      <FirstPersonArms />
    </>
  );
}
