import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { dbBookToApi } from "@/lib/books/normalizeBook";

export async function GET() {
  try {
    const rows = await prisma.book.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ books: rows.map(dbBookToApi) });
  } catch {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(
      { error: "Не указано название книги" },
      { status: 400 },
    );
  }

  const authors = Array.isArray(body.authors)
    ? body.authors.filter((a): a is string => typeof a === "string")
    : [];
  const categories = Array.isArray(body.categories)
    ? body.categories.filter((c): c is string => typeof c === "string")
    : [];
  const isbn = typeof body.isbn === "string" ? body.isbn : null;

  try {
    const duplicate = await prisma.book.findFirst({
      where: isbn ? { OR: [{ isbn }, { title }] } : { title },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Эта книга уже есть в вашей библиотеке" },
        { status: 409 },
      );
    }

    const created = await prisma.book.create({
      data: {
        title,
        authors: JSON.stringify(authors),
        description:
          typeof body.description === "string" ? body.description : null,
        coverUrl: typeof body.coverUrl === "string" ? body.coverUrl : null,
        isbn,
        publishedDate:
          typeof body.publishedDate === "string" ? body.publishedDate : null,
        pageCount: typeof body.pageCount === "number" ? body.pageCount : null,
        categories: JSON.stringify(categories),
        status: typeof body.status === "string" ? body.status : "completed",
        completedAt:
          typeof body.completedAt === "string"
            ? new Date(body.completedAt)
            : new Date(),
      },
    });

    return NextResponse.json({ book: dbBookToApi(created) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить книгу" },
      { status: 500 },
    );
  }
}
