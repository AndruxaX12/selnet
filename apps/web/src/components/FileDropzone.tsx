"use client";
import { useCallback, useState } from "react";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  children?: React.ReactNode;
}

export default function FileDropzone({ 
  onFilesSelected, 
  maxFiles = 5, 
  maxSize = 10,
  accept = "image/*",
  children 
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > maxSize * 1024 * 1024) return false;
      return true;
    }).slice(0, maxFiles);
    
    onFilesSelected(validFiles);
  }, [onFilesSelected, maxFiles, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > maxSize * 1024 * 1024) return false;
      return true;
    }).slice(0, maxFiles);
    
    onFilesSelected(validFiles);
  }, [onFilesSelected, maxFiles, maxSize]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver 
          ? 'border-green-400 bg-green-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="mb-4">
        <span className="text-4xl">📁</span>
      </div>
      <p className="text-gray-600 mb-2">
        Плъзнете файловете тук или{" "}
        <label className="text-green-600 underline cursor-pointer">
          изберете файлове
          <input
            type="file"
            multiple
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </p>
      <p className="text-xs text-gray-500">Максимален размер: {maxSize}.0MB</p>
      {children}
    </div>
  );
}
