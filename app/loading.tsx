export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="h-72 animate-pulse rounded-xl bg-neutral-100 lg:col-span-3" />
        <div className="h-72 animate-pulse rounded-xl bg-neutral-100 lg:col-span-2" />
      </div>
      <div className="mt-4 h-48 animate-pulse rounded-xl bg-neutral-100" />
    </main>
  );
}
