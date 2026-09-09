import type { Photo } from "./models";
import { id } from "./store";

/**
 * Browser-only photo handling. Images are downscaled before being stored so the
 * localStorage demo store stays well inside quota. No external upload yet.
 */

const MAX_EDGE = 720;
const MAX_PHOTOS = 6;

export const MAX_SHIFT_PHOTOS = MAX_PHOTOS;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

async function downscale(dataUrl: string) {
  if (typeof document === "undefined") return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("bad image"));
      el.src = dataUrl;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return dataUrl;
  }
}

export async function filesToPhotos(
  files: FileList | File[],
  kind: Photo["kind"],
  source: Photo["source"],
): Promise<Photo[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  const out: Photo[] = [];
  for (const file of list) {
    const raw = await readAsDataUrl(file);
    out.push({
      id: id("ph"),
      dataUrl: await downscale(raw),
      fileName: file.name || `${kind}-${Date.now()}.jpg`,
      kind,
      takenAt: new Date().toISOString(),
      source,
    });
  }
  return out;
}
