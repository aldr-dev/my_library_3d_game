export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#171310]">
      {/* тёплое свечение по центру */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/[0.07] blur-3xl" />
      {/* виньетка */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      <div className="relative flex flex-col items-center">
        {/* подпрыгивающие книги */}
        <div className="flex gap-2 text-4xl">
          <span className="loading-book" style={{ animationDelay: "0ms" }}>
            📕
          </span>
          <span className="loading-book" style={{ animationDelay: "140ms" }}>
            📗
          </span>
          <span className="loading-book" style={{ animationDelay: "280ms" }}>
            📘
          </span>
        </div>

        <span className="mt-7 text-2xl font-semibold tracking-[0.35em] text-amber-100">
          MY LIBRARY
        </span>
        <span className="mt-3 text-sm text-white/45">
          Загружаем библиотеку…
        </span>

        {/* бегущий прогресс-бар */}
        <div className="mt-7 h-1.5 w-64 overflow-hidden rounded-full border border-white/5 bg-white/5">
          <div className="loading-bar h-full w-1/3 rounded-full bg-gradient-to-r from-amber-200/40 via-amber-200 to-amber-200/40 shadow-[0_0_12px_rgba(251,211,141,0.6)]" />
        </div>
      </div>
    </div>
  );
}
