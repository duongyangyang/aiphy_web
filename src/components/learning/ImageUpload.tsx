import { useCallback, useRef, useState } from "react";
import { useT } from "../../i18n/useT";

interface ImageUploadProps {
  /** File đã chọn (hoặc null nếu chưa chọn). */
  file: File | null;
  /** Callback khi người dùng chọn (hoặc thay đổi) file. */
  onFile: (f: File | null) => void;
  /** Nhãn hiển thị phía trên vùng upload. */
  label: string;
  /** Hint text bên dưới nhãn. */
  hint?: string;
  /** Định dạng chấp nhận, vd "image/png". */
  accept?: string;
  /** ID cho label (a11y). */
  id?: string;
  /** Khi true, hiển thị trạng thái đã chọn ảnh với preview. */
  hasPreview?: boolean;
}

/**
 * ImageUpload — vùng kéo-thả + chọn ảnh, có preview.
 * Dùng chung cho Module 3 (ảnh anchor) và Module 4 (ảnh low-res / HQ).
 */
export function ImageUpload({
  file,
  onFile,
  label,
  hint,
  accept = "image/png,image/jpeg,image/jpg,image/webp,image/bmp",
  id = "image-upload",
  hasPreview = true,
}: ImageUploadProps) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (f: File | null) => {
      // Revoke URL cũ nếu có.
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (f && hasPreview) {
        setPreviewUrl(URL.createObjectURL(f));
      }
      onFile(f);
    },
    [onFile, hasPreview, previewUrl],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.type.startsWith("image/")) {
        handleFile(dropped);
      }
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] ?? null;
      handleFile(selected);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleFile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <label
        htmlFor={id}
        className="mono"
        style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}
      >
        {label}
      </label>

      {hint && (
        <p style={{ fontSize: "0.74rem", color: "var(--color-faint)", margin: 0 }}>
          {hint}
        </p>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        style={{
          border: `2px dashed ${dragOver ? "var(--color-proton-cyan)" : "var(--color-line)"}`,
          borderRadius: "var(--radius-sm)",
          padding: file ? "var(--space-3)" : "var(--space-5) var(--space-3)",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
          background: dragOver
            ? "rgba(55,215,232,0.06)"
            : "var(--color-bore-2)",
          minHeight: file ? "auto" : 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: "none" }}
          aria-hidden
        />

        {file ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", width: "100%" }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 160,
                  objectFit: "contain",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-line)",
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-2)",
              }}
            >
              <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-proton-cyan)" }}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                style={{
                  background: "none",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-muted)",
                  padding: "2px 8px",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-data)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <span
            className="mono"
            style={{ fontSize: "0.8rem", color: "var(--color-faint)" }}
          >
            {t("ml.upload.dropHint")}
          </span>
        )}
      </div>
    </div>
  );
}