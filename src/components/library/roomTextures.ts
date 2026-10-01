// Процедурные текстуры интерьера (canvas -> CanvasTexture).
// Генерируются один раз на клиенте: паркет, стены, ковры, картины.

import * as THREE from "three";

function finish(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  return tex;
}

function shade(base: [number, number, number], k: number): string {
  const r = Math.round(Math.min(255, base[0] * k));
  const g = Math.round(Math.min(255, base[1] * k));
  const b = Math.round(Math.min(255, base[2] * k));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Паркет из широких досок со стыками и волокном. */
export function makeParquetTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const base: [number, number, number] = [124, 80, 44];

  ctx.fillStyle = shade(base, 1);
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * 90;
    for (let x = -180; x < 512; x += 180) {
      const px = x + offset;
      const k = 0.78 + Math.random() * 0.4;
      ctx.fillStyle = shade(base, k);
      ctx.fillRect(px, r * rowH, 176, rowH - 2);

      // волокно
      ctx.strokeStyle = `rgba(60, 34, 14, ${0.06 + Math.random() * 0.08})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = r * rowH + 4 + Math.random() * (rowH - 10);
        ctx.beginPath();
        ctx.moveTo(px + 4, y);
        ctx.bezierCurveTo(px + 50, y + 2, px + 110, y - 2, px + 172, y);
        ctx.stroke();
      }
    }
    // стык между рядами
    ctx.fillStyle = "rgba(40, 22, 10, 0.55)";
    ctx.fillRect(0, r * rowH + rowH - 2, 512, 2);
  }

  return finish(c, 9, 7);
}

/** Штукатурка тёплого тона с лёгким зерном. */
export function makeWallTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#93806a";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 5000; i++) {
    const a = Math.random() * 0.06;
    ctx.fillStyle =
      Math.random() > 0.5 ? `rgba(255,240,215,${a})` : `rgba(60,45,30,${a})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  return finish(c, 6, 3);
}

/** Классический ковёр с бордюром и медальоном. */
export function makeRugTexture(
  field: string,
  accent: string,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = field;
  ctx.fillRect(0, 0, 256, 256);

  // бордюры
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 228, 228);
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 196, 196);

  // ритмичный орнамент по бордюру
  ctx.fillStyle = accent;
  for (let i = 22; i < 236; i += 22) {
    ctx.fillRect(i, 18, 8, 8);
    ctx.fillRect(i, 230, 8, 8);
    ctx.fillRect(18, i, 8, 8);
    ctx.fillRect(230, i, 8, 8);
  }

  // центральный медальон
  ctx.save();
  ctx.translate(128, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -44, 16, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  // потёртости
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }

  return finish(c);
}

/** Небольшой пейзаж/абстракция для картины в раме. */
export function makePaintingTexture(seed: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 192;
  const ctx = c.getContext("2d")!;
  const rnd = (n: number) => ((Math.sin(seed * 12.9898 + n * 78.233) + 1) / 2);

  // небо
  const sky = ctx.createLinearGradient(0, 0, 0, 192);
  const warm = 24 + rnd(1) * 30;
  sky.addColorStop(0, `hsl(${warm}, 45%, ${58 + rnd(2) * 12}%)`);
  sky.addColorStop(1, `hsl(${warm + 20}, 38%, ${30 + rnd(3) * 10}%)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 192);

  // солнце
  ctx.fillStyle = "rgba(255, 232, 186, 0.85)";
  ctx.beginPath();
  ctx.arc(70 + rnd(4) * 120, 60 + rnd(5) * 30, 14, 0, Math.PI * 2);
  ctx.fill();

  // холмы
  for (let layer = 0; layer < 3; layer++) {
    const y = 110 + layer * 24;
    ctx.fillStyle = `hsl(${100 + layer * 14}, ${18 + layer * 6}%, ${
      26 - layer * 6
    }%)`;
    ctx.beginPath();
    ctx.moveTo(0, 192);
    ctx.lineTo(0, y);
    for (let x = 0; x <= 256; x += 32) {
      ctx.lineTo(x, y - Math.sin((x + seed * 40 + layer * 50) * 0.02) * 16);
    }
    ctx.lineTo(256, 192);
    ctx.closePath();
    ctx.fill();
  }

  // лёгкая патина старого холста
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(90, 70, 40, ${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 192, 2, 2);
  }

  return finish(c);
}
