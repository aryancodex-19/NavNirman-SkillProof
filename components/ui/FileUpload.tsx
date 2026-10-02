"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, File, AlertCircle, Check, Loader2 } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  loading?: boolean;
  progress?: number;
}

export default function FileUpload({
  onFileSelect,
  accept = "application/pdf",
  maxSizeMB = 5,
  loading = false,
  progress = 0,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (accept && file.type !== accept && !file.name.endsWith(".pdf")) {
      setErrorMessage("Please upload a PDF file only.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File is too large. Max size is ${maxSizeMB}MB.`);
      return;
    }

    setSelectedFileName(file.name);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 min-h-[220px] ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-card-hover bg-card"
        } ${loading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{progress}%</span>
              </div>
            </div>
            <div>
              <p className="text-foreground font-semibold">AI is analyzing your resume...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Extracting contact info, skills, education, and career experience.
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-64 bg-secondary rounded-full h-2 overflow-hidden mt-2 border border-border">
              <div
                className="bg-primary h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300">
              {selectedFileName ? (
                <Check className="w-8 h-8" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>

            {selectedFileName ? (
              <div className="space-y-1">
                <p className="text-foreground font-medium flex items-center justify-center gap-2">
                  <File className="w-4 h-4 text-primary" />
                  {selectedFileName}
                </p>
                <p className="text-xs text-muted-foreground">Click or drag another file to replace</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-foreground font-semibold">
                  Drag and drop your PDF resume here, or{" "}
                  <span className="text-primary hover:underline">browse files</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF format only (Max {maxSizeMB}MB)
                </p>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 p-2 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
