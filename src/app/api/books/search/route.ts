import { NextRequest, NextResponse } from "next/server";
import { searchOpenLibrary } from "@/lib/books/openLibrary";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json(
      { error: "Укажите название книги или ISBN" },
      { status: 400 },
    );
  }

  try {
    const results = await searchOpenLibrary(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Сервис поиска книг временно недоступен. Попробуйте позже." },
      { status: 502 },
    );
  }
}
