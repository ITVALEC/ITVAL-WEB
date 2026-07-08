export default function Loading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-cornflower/30 border-t-cornflower motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
