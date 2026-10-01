// Генерация canvas-текстур книги (обложка-fallback и корешок).
// Используется и книгами на полках (Book3D), и книгой в руках (HeldBookMesh).

import * as THREE from "three";
import type { Book } from "@/types/book";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function bookColor(book: Book): string {
  const hue = hashString(book.title) % 360;
  return `hsl(${hue}, 42%, 34%)`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

// Корешок: цвет книги + название вертикально.
export function makeSpineTexture(book: Book): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bookColor(book);
  ctx.fillRect(0, 0, 128, 512);
  ctx.fillStyle = "rgba(255, 225, 170, 0.85)";
  ctx.fillRect(0, 18, 128, 5);
  ctx.fillRect(0, 489, 128, 5);

  ctx.save();
  ctx.translate(64, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#f7ecd7";
  ctx.font = "bold 38px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let title = book.title.toUpperCase();
  if (title.length > 24) title = `${title.slice(0, 23)}…`;
  ctx.fillText(title, 0, 0, 430);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Fallback-обложка: генерируется, если у книги нет coverUrl
// или изображение не удалось загрузить.
export function makeFallbackCoverTexture(book: Book): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bookColor(book);
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = "rgba(255, 228, 180, 0.8)";
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 228, 356);

  ctx.fillStyle = "#f7ecd7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 26px Georgia, serif";
  const titleLines = wrapText(ctx, book.title.toUpperCase(), 200);
  const startY = 150 - ((titleLines.length - 1) * 32) / 2;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, 128, startY + i * 32, 210);
  });

  ctx.font = "italic 18px Georgia, serif";
  ctx.fillStyle = "rgba(247, 236, 215, 0.85)";
  const author = book.authors[0] ?? "";
  ctx.fillText(author, 128, 320, 210);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
