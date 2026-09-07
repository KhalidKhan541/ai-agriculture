"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  File,
  FileImage,
  FileText,
  FileSpreadsheet,
  Film,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress?: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const fileIcons: Record<string, React.ReactNode> = {
  "image/": <FileImage className="h-5 w-5 text-blue-500" />,
  "video/": <Film className="h-5 w-5 text-purple-500" />,
  "audio/": <Music className="h-5 w-5 text-pink-500" />,
  "text/": <FileText className="h-5 w-5 text-green-500" },
  "application/pdf": <FileText className="h-5 w-5 text-red-500" },
  "application/vnd.openxmlformats-officedocument": (
    <FileSpreadsheet className="h-5 w-5 text-green-600" />
  ),
  "application/vnd.ms-excel": (
    <FileSpreadsheet className="h-5 w-5 text-green-600" />
  ),
};

function getFileIcon(type: string) {
  for (const [prefix, icon] of Object.entries(fileIcons)) {
    if (type.startsWith(prefix)) return icon;
  }
  return <File className="h-5 w-5 text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function FileUpload({
  accept,
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  onFilesChange,
  onUpload,
  disabled = false,
  className,
}: FileUploadProps) {
  const [uploads, setUploads] = React.useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addFiles = React.useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles = fileArray
        .filter((f) => f.size <= maxSize)
        .slice(0, maxFiles - uploads.length);

      const newUploads: UploadFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substring(2, 15),
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: "pending" as const,
      }));

      setUploads((prev) => {
        const updated = [...prev, ...newUploads];
        onFilesChange?.(updated.map((u) => u.file));
        return updated;
      });
    },
    [uploads.length, maxSize, maxFiles, onFilesChange]
  );

  const removeFile = (id: string) => {
    setUploads((prev) => {
      const file = prev.find((u) => u.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      const updated = prev.filter((u) => u.id !== id);
      onFilesChange?.(updated.map((u) => u.file));
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-green-400 hover:bg-gray-50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          <span className="text-green-600">Click to upload</span> or drag and
          drop
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {accept
            ? `Accepted: ${accept}`
            : "All file types"}{" "}
          · Max {formatFileSize(maxSize)} · Up to {maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={disabled}
        />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              {upload.preview ? (
                <img
                  src={upload.preview}
                  alt={upload.file.name}
                  className="h-10 w-10 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                  {getFileIcon(upload.file.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.status === "uploading" && upload.progress !== undefined && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFile(upload.id)}
                className="shrink-0 text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { FileUpload, formatFileSize, type UploadFile, type FileUploadProps };
