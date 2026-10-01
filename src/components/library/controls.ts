// Изменяемое покадровое состояние, разделяемое между игроком, камерой и вводом.
// Намеренно хранится вне React state: оно меняется каждый кадр и не должно
// вызывать ререндеры.

export type ViewMode = "third" | "first";

export const cameraState: {
  yaw: number;
  pitch: number;
  distance: number;
  mode: ViewMode;
} = {
  yaw: 0,
  pitch: 0.35,
  distance: 4.5,
  mode: "third",
};

export const inputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
  jumpQueued: false,
};
