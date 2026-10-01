"use client";

import Book3D from "./Book3D";
import type { BookSlot } from "./shelfLayout";
import { useLibraryStore } from "@/store/libraryStore";

interface BooksOnShelvesProps {
  slots: BookSlot[];
}

export default function BooksOnShelves({ slots }: BooksOnShelvesProps) {
  const nearbyBookId = useLibraryStore((s) => s.nearbyBookId);
  const selectedBookId = useLibraryStore((s) => s.selectedBookId);
  const heldBookId = useLibraryStore((s) => s.heldBookId);

  return (
    <group>
      {slots
        .filter((slot) => slot.book.id !== heldBookId)
        .map((slot) => (
          <Book3D
            key={slot.book.id}
            slot={slot}
            isNearby={slot.book.id === nearbyBookId}
            isSelected={slot.book.id === selectedBookId}
          />
        ))}
    </group>
  );
}
