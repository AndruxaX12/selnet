"use client";
import { useState } from "react";
import { compressImage, uploadWithProgress } from "@/lib/upload";
import Button from "@/components/ui/Button";

export default function PhotosUploader({
  onChange, max = 6
}: { onChange: (items: { url: string; path: string }[]) => void; max?: number }) {
  const [items, setItems] = useState<{ url: string; path: string; progress?: number }[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSelect(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const next = [...items];
    
    for (const file of Array.from(files).slice(0, max - items.length)) {
      try {
        const compressed = await compressImage(file);
        const name = `${crypto.randomUUID()}-${compressed.name.replace(/\s+/g, "_")}`;
        const path = `uploads/_public/${name}`;
        
        const res = await uploadWithProgress(compressed as File, path, (p) => {
          const i = next.findIndex(x => x.path === path);
          if (i >= 0) next[i].progress = p; 
          else next.push({ url: "", path, progress: p });
          setItems([...next]);
        });
        
        const i = next.findIndex(x => x.path === res.path);
        if (i >= 0) next[i] = { url: res.url, path: res.path };
        setItems([...next]);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
    
    setBusy(false);
    onChange(next.map(({ url, path }) => ({ url, path })));
  }

  function remove(path: string) {
    const filtered = items.filter(x => x.path !== path);
    setItems(filtered);
    onChange(filtered.map(({ url, path }) => ({ url, path })));
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => document.getElementById("photos-upload")?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onSelect(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        aria-label="Качете снимки"
      >
        <input 
          id="photos-upload" 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          multiple 
          onChange={(e) => onSelect(e.target.files)}
          className="sr-only"
          disabled={busy || items.length >= max}
        />
        <div className="space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-xl sm:text-2xl">📷</span>
          </div>
          <div>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              disabled={busy || items.length >= max}
              className="mb-2 pointer-events-none"
            >
              {busy ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Качване...
                </>
              ) : (
                "Избери снимки"
              )}
            </Button>
            <p className="text-xs sm:text-sm text-gray-500">
              или пуснете файловете тук
            </p>
          </div>
          <p className="text-xs text-gray-400">
            До {max} снимки • Макс. 1MB • JPG, PNG, WEBP
          </p>
          {items.length >= max && (
            <p className="text-xs text-amber-600 font-medium">
              Достигнахте максималния брой снимки
            </p>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Качени снимки ({items.length}/{max})
            </h4>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  onChange([]);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Изчисти всички
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {items.map((x, index) => (
              <div key={x.path} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 transition-all duration-200 group-hover:border-gray-300">
                  {x.url ? (
                    <img 
                      src={x.url} 
                      alt={`Снимка ${index + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm">📤</span>
                      </div>
                      <div className="text-xs sm:text-sm font-medium mb-1">{x.progress ?? 0}%</div>
                      <div className="w-12 sm:w-16 h-1 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${x.progress ?? 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1 text-center">Качване...</div>
                    </div>
                  )}
                </div>
                
                {/* Delete Button */}
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(x.path);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-sm"
                  aria-label={`Премахни снимка ${index + 1}`}
                >
                  ✕
                </button>
                
                {/* Image Index */}
                {x.url && (
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
