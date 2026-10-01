import { NextResponse } from "next/server";
import { randomOpenLibraryBook } from "@/lib/books/openLibrary";

export async function GET() {
  try {
    const book = await randomOpenLibraryBook();
    if (!book) {
      return NextResponse.json(
        { error: "Не удалось подобрать книгу. Попробуйте ещё раз." },
        { status: 404 },
      );
    }
    return NextResponse.json({ book });
  } catch {
    return NextResponse.json(
      { error: "Сервис рекомендаций временно недоступен. Попробуйте позже." },
      { status: 502 },
    );
  }
}
