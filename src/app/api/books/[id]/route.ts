import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { dbBookToApi } from "@/lib/books/normalizeBook";

const VALID_STATUSES = ["planned", "reading", "completed"];

function isValidIndex(v: unknown): v is number | null {
  return v === null || (typeof v === "number" && Number.isInteger(v) && v >= 0);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const data: {
    status?: string;
    completedAt?: Date | null;
    shelfIndex?: number | null;
    rowIndex?: number | null;
  } = {};

  try {
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Книга не найдена" }, { status: 404 });
    }

    // смена статуса
    if (body.status !== undefined) {
      const status = typeof body.status === "string" ? body.status : null;
      if (!status || !VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: "Некорректный статус книги" },
          { status: 400 },
        );
      }
      data.status = status;
      data.completedAt =
        status === "completed" ? existing.completedAt ?? new Date() : null;
    }

    // пользовательское размещение на полке
    if (body.shelfIndex !== undefined || body.rowIndex !== undefined) {
      if (!isValidIndex(body.shelfIndex) || !isValidIndex(body.rowIndex)) {
        return NextResponse.json(
          { error: "Некорректная позиция книги" },
          { status: 400 },
        );
      }
      data.shelfIndex = body.shelfIndex;
      data.rowIndex = body.rowIndex;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Нет данных для обновления" },
        { status: 400 },
      );
    }

    const updated = await prisma.book.update({ where: { id }, data });
    return NextResponse.json({ book: dbBookToApi(updated) });
  } catch {
    return NextResponse.json(
      { error: "Не удалось обновить книгу" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Книга не найдена" }, { status: 404 });
    }

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось удалить книгу" },
      { status: 500 },
    );
  }
}
