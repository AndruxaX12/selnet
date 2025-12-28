import { useState } from "react";
import { Image as ImageIcon, X, ZoomIn, Upload } from "lucide-react";

interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video";
  created_at: string;
}

interface Props {
  signalId: string;
  media: MediaFile[];
  onChange: () => void;
}

export function MediaGallery({ signalId, media, onChange }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    // TODO: Implement upload to API
    console.log("Uploading files:", files);
    setTimeout(() => {
      setUploading(false);
      onChange();
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Медия ({media?.length || 0}/10)
        </h2>

        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
          <Upload className="h-4 w-4" />
          Качи снимка
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            disabled={uploading || (media?.length || 0) >= 10}
          />
        </label>
      </div>

      {!media || media.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Няма качени снимки</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {media.map((file) => (
            <div
              key={file.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
              onClick={() => setLightbox(file.url)}
            >
              <img
                src={file.url}
                alt="Signal media"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightbox}
            alt="Lightbox"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
