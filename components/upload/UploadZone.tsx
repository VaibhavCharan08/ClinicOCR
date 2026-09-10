"use client";

import { useState, useCallback, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface UploadZoneProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

// Client-side image resizer/compressor to ensure fast transfers & database efficiency
async function compressImage(file: File): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxDim = 1800; // Optimal resolution for OCR and clinical records
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve({ file, dataUrl: e.target?.result as string });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        // Also create a compressed File object
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({ file: compressedFile, dataUrl });
            } else {
              resolve({ file, dataUrl });
            }
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function UploadZone({ onImageSelected, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file (JPG, PNG, WebP)");
        return;
      }

      setIsProcessing(true);
      try {
        const { file: optimizedFile, dataUrl } = await compressImage(file);
        setPreview(dataUrl);
        onImageSelected(optimizedFile, dataUrl);
      } catch (err) {
        console.error("Failed to process image:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="relative rounded-xl border-2 border-blue-300 bg-slate-900/5 p-2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Prescription preview"
          className="w-full max-h-96 object-contain rounded-lg bg-white"
        />
        {!disabled && (
          <button
            onClick={clearImage}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-slate-600 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-all",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50",
        (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <ImagePlus className="h-8 w-8 text-blue-600" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-700">
          {isProcessing ? "Optimizing image..." : "Drop prescription image here"}
        </p>
        <p className="text-sm text-slate-500 mt-1">or click to browse — JPG, JPEG, PNG, WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />
    </div>
  );
}
