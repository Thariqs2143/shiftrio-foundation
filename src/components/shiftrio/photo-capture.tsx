import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Photo } from "@/lib/models";
import { filesToPhotos, MAX_SHIFT_PHOTOS } from "@/lib/photos";
import { formatTime } from "@/lib/store";
import { EmptyState } from "./empty-state";

export function PhotoCapture({
  photos,
  onChange,
  kind,
  hint,
}: {
  photos: Photo[];
  onChange: (next: Photo[]) => void;
  kind: Photo["kind"];
  hint?: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null, source: Photo["source"]) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const added = await filesToPhotos(files, kind, source);
      if (added.length === 0) {
        setError("Please choose an image file.");
        return;
      }
      onChange([...photos, ...added].slice(0, MAX_SHIFT_PHOTOS));
    } catch {
      setError("That file could not be read. Try another photo.");
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  const full = photos.length >= MAX_SHIFT_PHOTOS;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12"
          disabled={busy || full}
          onClick={() => cameraRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          disabled={busy || full}
          onClick={() => uploadRef.current?.click()}
        >
          <ImagePlus className="size-4" /> Upload
        </Button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files, "camera")}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files, "upload")}
      />

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {full ? (
        <p className="text-xs text-warning">
          Maximum {MAX_SHIFT_PHOTOS} photos. Delete one to add another.
        </p>
      ) : null}

      {photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No photos yet"
          body="Add at least one photo as proof for this shift. Camera opens on mobile; upload works everywhere."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="aspect-[4/3] w-full bg-surface">
                {p.dataUrl ? (
                  <img
                    src={p.dataUrl}
                    alt={`Shift ${p.kind === "check_in" ? "check-in" : "check-out"} photo ${p.fileName}`}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <Camera className="size-5" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{p.fileName}</p>
                  <p className="truncate text-[0.7rem] text-muted-foreground">
                    {p.source === "camera" ? "Camera" : "Upload"} · {formatTime(p.takenAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  aria-label={`Delete photo ${p.fileName}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
