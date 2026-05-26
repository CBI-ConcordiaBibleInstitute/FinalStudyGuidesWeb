export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-maroon/20 border-t-maroon" />
        <p className="font-medium text-ink">Opening the Word…</p>
      </div>
    </div>
  );
}
