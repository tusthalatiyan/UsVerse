export function GradientOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="orbit-float absolute -left-8 top-12 h-36 w-36 rounded-full bg-rose-200/60 blur-3xl" />
      <div className="orbit-float-delayed absolute right-0 top-20 h-40 w-40 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="orbit-float absolute bottom-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-amber-200/45 blur-3xl" />
    </div>
  );
}
