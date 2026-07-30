import { FILE_MAX_BYTES, TEXT_MAX, TEXT_MIN, type SourceConfig } from "./constants";

export function validateUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter a website URL.";
  try {
    const u = new URL(v);
    if (!/^https?:$/.test(u.protocol)) return "URL must start with http:// or https://";
    return null;
  } catch {
    return "Please enter a valid website URL.";
  }
}

const YT_RE =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{6,}/i;

export function validateYouTubeUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter a YouTube URL.";
  if (!YT_RE.test(v)) return "Please enter a valid YouTube video URL.";
  return null;
}

export function validateText(value: string): string | null {
  const len = value.trim().length;
  if (len === 0) return "Please paste some text to summarize.";
  if (len < TEXT_MIN) return `Text is too short (min ${TEXT_MIN} characters).`;
  if (len > TEXT_MAX)
    return `Text is too long (max ${TEXT_MAX.toLocaleString("en-US")} characters).`;
  return null;
}

export function validateFile(file: File, source: SourceConfig): string | null {
  if (source.kind !== "file" || !source.extensions) return null;
  const name = file.name.toLowerCase();
  const ok = source.extensions.some((ext) => name.endsWith(ext));
  if (!ok) return `This file type is not supported for ${source.label}.`;
  if (file.size > FILE_MAX_BYTES) return "Maximum file size exceeded (25 MB).";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
