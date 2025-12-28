"use client";
import { useState, useRef, useCallback } from 'react';
import { vibrateLight, vibrateImpact } from '@/lib/mobile/haptics';

interface CameraUploadProps {
  onFileSelect: (files: File[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function CameraUpload({
  onFileSelect,
  onError,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/*', 'video/*'],
  className = ''
}: CameraUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `Файлът е твърде голям. Максимален размер: ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Неподдържан тип файл. Разрешени: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    // Check max files limit
    if (validFiles.length > maxFiles) {
      errors.push(`Твърде много файлове. Максимум: ${maxFiles}`);
      validFiles.splice(maxFiles);
    }

    // Handle errors
    if (errors.length > 0) {
      onError?.(errors.join('\n'));
      vibrateImpact();
    }

    // Process valid files
    if (validFiles.length > 0) {
      vibrateLight();
      onFileSelect(validFiles);
      
      // Create preview URLs
      const urls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...urls]);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [onFileSelect, onError, maxFiles, maxSize, acceptedTypes]);

  const handleCameraCapture = useCallback(() => {
    vibrateLight();
    setIsCapturing(true);
    cameraInputRef.current?.click();
  }, []);

  const handleGallerySelect = useCallback(() => {
    vibrateLight();
    fileInputRef.current?.click();
  }, []);

  const clearPreviews = useCallback(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    vibrateLight();
  }, [previewUrls]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={(e) => {
          handleFileSelect(e.target.files);
          setIsCapturing(false);
        }}
        className="hidden"
      />

      {/* Upload buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCameraCapture}
          disabled={isCapturing}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <div className="text-3xl mb-2">📷</div>
          <span className="text-sm font-medium text-gray-700">
            {isCapturing ? 'Отваря камера...' : 'Снимай'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Камера
          </span>
        </button>

        <button
          onClick={handleGallerySelect}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <div className="text-3xl mb-2">🖼️</div>
          <span className="text-sm font-medium text-gray-700">
            Избери файлове
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Галерия
          </span>
        </button>
      </div>

      {/* File info */}
      <div className="text-xs text-gray-500 text-center">
        Максимум {maxFiles} файла, до {maxSize}MB всеки
      </div>

      {/* Preview section */}
      {previewUrls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Избрани файлове ({previewUrls.length})
            </h4>
            <button
              onClick={clearPreviews}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Изчисти всички
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(url);
                    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                    vibrateLight();
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized camera-only component
export function CameraCapture({
  onCapture,
  onError,
  className = ''
}: {
  onCapture: (file: File) => void;
  onError?: (error: string) => void;
  className?: string;
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(() => {
    vibrateLight();
    setIsCapturing(true);
    cameraInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    setIsCapturing(false);
    
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Basic validation
    if (file.size > 10 * 1024 * 1024) {
      onError?.('Файлът е твърде голям (максимум 10MB)');
      vibrateImpact();
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      onError?.('Моля изберете изображение');
      vibrateImpact();
      return;
    }
    
    vibrateLight();
    onCapture(file);
  }, [onCapture, onError]);

  return (
    <div className={className}>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <button
        onClick={handleCapture}
        disabled={isCapturing}
        className="w-full flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <span className="text-2xl mr-3">📷</span>
        {isCapturing ? 'Отваря камера...' : 'Снимай'}
      </button>
    </div>
  );
}
