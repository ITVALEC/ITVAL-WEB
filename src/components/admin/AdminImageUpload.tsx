"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { AdminButton } from "@/components/admin/AdminCrud";

type UploadAction = "replace" | "add-project" | "add-product";

type AdminImageUploadProps = {
  label?: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  uploading?: boolean;
  action: UploadAction;
  mediaId?: string;
  projectId?: string;
  category?: string;
  subcategory?: string;
  caption?: string;
  onSuccess?: (result: { src?: string; item?: unknown }) => void;
  onError?: (message: string) => void;
  children?: ReactNode;
  variant?: "primary" | "secondary";
};

export function AdminImageUpload({
  label = "Elegir imagen",
  hint,
  accept = "image/jpeg,image/png,image/webp,image/avif,image/gif",
  disabled,
  uploading,
  action,
  mediaId,
  projectId,
  category,
  subcategory,
  caption,
  onSuccess,
  onError,
  children,
  variant = "secondary",
}: AdminImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;

    setBusy(true);
    setLocalError(null);

    const form = new FormData();
    form.set("file", file);
    form.set("action", action);
    if (mediaId) form.set("mediaId", mediaId);
    if (projectId) form.set("projectId", projectId);
    if (category) form.set("category", category);
    if (subcategory) form.set("subcategory", subcategory);
    if (caption) form.set("caption", caption);

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
      let data: { error?: string; src?: string; item?: unknown; ok?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Error del servidor (${res.status}).` };
      }
      if (!res.ok) {
        const message = data.error ?? `No se pudo subir la imagen (${res.status}).`;
        setLocalError(message);
        onError?.(message);
        return;
      }
      onSuccess?.(data);
    } catch {
      const message = "Error de red al subir la imagen. Revisa la conexión e inténtalo de nuevo.";
      setLocalError(message);
      onError?.(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isDisabled = disabled || uploading || busy;

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={isDisabled}
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      {children ? (
        <label htmlFor={inputId} className={isDisabled ? "pointer-events-none opacity-60" : "cursor-pointer"}>
          {children}
        </label>
      ) : (
        <div>
          <AdminButton
            variant={variant}
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
          >
            {busy || uploading ? "Subiendo…" : label}
          </AdminButton>
          {hint ? <p className="mt-1 text-xs text-grey">{hint}</p> : null}
        </div>
      )}
      {localError ? (
        <p className="mt-2 text-sm font-medium text-error" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
