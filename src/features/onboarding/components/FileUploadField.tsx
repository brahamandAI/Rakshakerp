"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileText, X, Eye, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DocumentType,
  DOCUMENT_LABELS,
  MAX_FILE_SIZE,
} from "@/features/onboarding/constants";
import {
  ACCEPTED_FILE_EXTENSIONS,
  isAllowedUpload,
} from "@/lib/files/mime";
import { DocumentRecord } from "@/features/onboarding/types";
import { deleteDocumentAction } from "@/features/onboarding/actions/onboarding.actions";
import { CameraCaptureModal } from "@/features/onboarding/components/CameraCaptureModal";

interface FileUploadFieldProps {
  documentType: DocumentType;
  description?: string;
  existing?: DocumentRecord;
  required?: boolean;
  onUploaded: (doc: DocumentRecord) => void;
  onDeleted: (documentType: DocumentType) => void;
  ensureApplicationReady?: () => Promise<boolean>;
}

function defaultFacingMode(documentType: DocumentType): "user" | "environment" {
  return documentType === DocumentType.PHOTO ? "user" : "environment";
}

function isLocalDocId(id: string) {
  return id.startsWith("local-");
}

export function FileUploadField({
  documentType,
  description,
  existing,
  required,
  onUploaded,
  onDeleted,
  ensureApplicationReady,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const uploadGenRef = useRef(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const setLocalPreview = useCallback((url: string | null) => {
    if (previewUrlRef.current && previewUrlRef.current !== url) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setPreview(url);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAllowedUpload(file.name, file.type)) {
        setError("Only JPG, PNG, WEBP, and PDF allowed");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File must be under 5MB");
        return;
      }

      const gen = ++uploadGenRef.current;
      const localUrl = URL.createObjectURL(file);
      setLocalPreview(localUrl);

      const optimistic: DocumentRecord = {
        _id: `local-${documentType}`,
        documentType,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        url: localUrl,
        uploadedAt: new Date().toISOString(),
      };
      onUploaded(optimistic);
      setIsUploading(true);

      try {
        if (ensureApplicationReady) {
          const ready = await ensureApplicationReady();
          if (uploadGenRef.current !== gen) return;
          if (!ready) {
            onDeleted(documentType);
            setLocalPreview(null);
            setError(
              "Save applicant details in section 1 first, then upload the document again."
            );
            return;
          }
        }

        const postFile = async () => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("documentType", documentType);
          return fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });
        };

        let res = await postFile();
        if (uploadGenRef.current !== gen) return;

        let text = await res.text();
        let json: { error?: string; code?: string; data?: DocumentRecord } = {};
        if (text) {
          try {
            json = JSON.parse(text) as {
              error?: string;
              code?: string;
              data?: DocumentRecord;
            };
          } catch {
            onDeleted(documentType);
            setLocalPreview(null);
            setError("Upload failed. Server returned an invalid response.");
            return;
          }
        }

        const lockedOrUnauthorized =
          res.status === 401 ||
          json.code === "LOCKED" ||
          json.error === "Application is locked";

        if (!res.ok && lockedOrUnauthorized && ensureApplicationReady) {
          const ready = await ensureApplicationReady();
          if (uploadGenRef.current !== gen) return;
          if (ready) {
            res = await postFile();
            if (uploadGenRef.current !== gen) return;
            text = await res.text();
            json = {};
            if (text) {
              try {
                json = JSON.parse(text) as {
                  error?: string;
                  code?: string;
                  data?: DocumentRecord;
                };
              } catch {
                onDeleted(documentType);
                setLocalPreview(null);
                setError("Upload failed. Server returned an invalid response.");
                return;
              }
            }
          }
        }

        if (uploadGenRef.current !== gen) return;

        if (!res.ok) {
          onDeleted(documentType);
          setLocalPreview(null);
          setError(
            json.error === "Application is locked"
              ? "Upload is not ready yet. Please try again in a moment."
              : json.error ?? "Upload failed"
          );
          return;
        }

        if (!json.data) {
          onDeleted(documentType);
          setLocalPreview(null);
          setError("Upload failed. No document data returned.");
          return;
        }

        onUploaded(json.data);
      } catch {
        if (uploadGenRef.current !== gen) return;
        onDeleted(documentType);
        setLocalPreview(null);
        setError("Upload failed. Please try again.");
      } finally {
        if (uploadGenRef.current === gen) setIsUploading(false);
      }
    },
    [documentType, onUploaded, onDeleted, ensureApplicationReady, setLocalPreview]
  );

  async function handleDelete() {
    if (!existing) return;
    uploadGenRef.current += 1;
    setIsUploading(false);

    if (isLocalDocId(existing._id)) {
      setLocalPreview(null);
      onDeleted(documentType);
      return;
    }

    setIsDeleting(true);
    const result = await deleteDocumentAction(existing._id);
    if (result.success) {
      setLocalPreview(null);
      onDeleted(documentType);
    }
    setIsDeleting(false);
  }

  const isImage =
    existing?.mimeType.startsWith("image/") ||
    Boolean(preview?.startsWith("blob:"));

  const facingMode = defaultFacingMode(documentType);

  return (
    <>
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-[#0F172A]">
              {DOCUMENT_LABELS[documentType]}
              {required && <span className="ml-0.5 text-red-600">*</span>}
            </p>
            <p className="text-xs text-[#64748B]">
              {description ?? "Upload a file or take a photo · JPG, PNG, WEBP or PDF · Max 5MB"}
            </p>
          </div>
          {existing && (
            <div className="flex gap-1">
              <a
                href={preview ?? existing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded p-1.5 text-[#64748B] hover:bg-red-50 hover:text-red-600"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {existing ? (
          <div className="mt-3 flex items-center gap-3 rounded-md bg-green-50 p-3">
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview ?? existing.url}
                alt={existing.fileName}
                className="h-16 w-16 rounded object-cover"
              />
            )}
            {!isImage && <FileText className="h-8 w-8 text-green-700" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-green-800">
                {existing.fileName}
              </p>
              <p className="text-xs text-green-600">
                {isUploading
                  ? "Saved on this form · storing securely…"
                  : `${(existing.sizeBytes / 1024).toFixed(1)} KB · Uploaded`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="h-3.5 w-3.5" />
                Retake
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "mt-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CBD5E1] px-4 py-8 transition-colors hover:border-primary hover:bg-primary/5"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <Upload className="h-8 w-8 text-[#94A3B8]" />
            <p className="mt-2 text-sm text-[#64748B]">
              Upload a file or capture directly from your camera
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-2"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_FILE_EXTENSIONS}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture={facingMode}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleFile}
        title={`Capture ${DOCUMENT_LABELS[documentType]}`}
        defaultFacingMode={facingMode}
      />
    </>
  );
}
