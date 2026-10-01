"use client";

import dynamic from "next/dynamic";
import LoadingScreen from "@/components/ui/LoadingScreen";

const LibraryApp = dynamic(() => import("@/components/library/LibraryApp"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function HomePage() {
  return <LibraryApp />;
}
