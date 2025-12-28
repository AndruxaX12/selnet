"use client";

// Премахни <html> и <body> таговете
export default function Error({ error, reset }: { error: any; reset: () => void }) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-3">
      <div className="text-6xl text-red-500">500</div>
      <div className="text-xl font-semibold">Възникна грешка в този раздел</div>
      <div className="text-sm text-neutral-600">
        {error?.message || "Нещо се обърка"}
      </div>
      <button 
        onClick={reset} 
        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
      >
        Опитай отново
      </button>
    </div>
  );
}