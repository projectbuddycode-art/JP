export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded bg-line" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-xl bg-line" />
        <div className="h-32 animate-pulse rounded-xl bg-line" />
        <div className="h-32 animate-pulse rounded-xl bg-line" />
      </div>
    </div>
  );
}
