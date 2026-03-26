'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-red-400 text-sm uppercase tracking-widest">Something went wrong</p>
      <p className="text-zinc-500 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-emerald-600 text-white text-sm uppercase tracking-wider hover:bg-emerald-500"
      >
        Try again
      </button>
    </div>
  );
}
