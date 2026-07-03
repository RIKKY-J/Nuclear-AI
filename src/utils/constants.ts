import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Globe,
  FileType,
  FileCode2,
  FileDown,
  Hash,
  Code2,
  Youtube,
} from "lucide-react";

export type SourceType =
  | "text"
  | "website"
  | "pdf"
  | "docx"
  | "txt"
  | "markdown"
  | "html"
  | "youtube";

export interface SourceConfig {
  id: SourceType;
  label: string;
  icon: LucideIcon;
  kind: "text" | "url" | "file" | "youtube";
  accept?: string;
  extensions?: string[];
}

export const SOURCES: SourceConfig[] = [
  { id: "text", label: "Text", icon: FileText, kind: "text" },
  { id: "website", label: "Website", icon: Globe, kind: "url" },
  { id: "pdf", label: "PDF", icon: FileDown, kind: "file", accept: ".pdf", extensions: [".pdf"] },
  { id: "docx", label: "DOCX", icon: FileType, kind: "file", accept: ".docx", extensions: [".docx"] },
  { id: "txt", label: "TXT", icon: FileText, kind: "file", accept: ".txt", extensions: [".txt"] },
  { id: "markdown", label: "Markdown", icon: Hash, kind: "file", accept: ".md,.markdown", extensions: [".md", ".markdown"] },
  { id: "html", label: "HTML", icon: Code2, kind: "file", accept: ".html,.htm", extensions: [".html", ".htm"] },
  { id: "youtube", label: "YouTube", icon: Youtube, kind: "youtube" },
];

export const TEXT_MIN = 20;
export const TEXT_MAX = 100_000;
export const FILE_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
