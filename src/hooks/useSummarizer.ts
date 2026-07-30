import { useCallback, useState } from "react";
import { toast } from "sonner";
import { summarize, type SummarizePayload, type SummaryResponse } from "@/services/api";
import { SOURCES, type SourceType } from "@/utils/constants";
import type { SummarizeInput } from "@/lib/summarize.functions";
import {
  validateFile,
  validateText,
  validateUrl,
  validateYouTubeUrl,
} from "@/utils/validators";

type Status = "idle" | "loading" | "success" | "error";

export function useSummarizer() {
  const [source, setSource] = useState<SourceType>("text");
  const [text, setText] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Phase 2 customization states
  const [mode, setMode] = useState<"standard" | "study" | "code">("standard");
  const [studySubmode, setStudySubmode] = useState<"notes" | "flashcards" | "qa">("notes");
  const [customLens, setCustomLens] = useState("");

  const changeSource = useCallback((s: SourceType) => {
    setSource(s);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
    setText("");
    setWebsiteUrl("");
    setYoutubeUrl("");
    setFile(null);
    setMode("standard");
    setStudySubmode("notes");
    setCustomLens("");
  }, []);

  const canSubmit = (() => {
    if (status === "loading") return false;
    const cfg = SOURCES.find((s) => s.id === source)!;
    if (cfg.kind === "text") return text.trim().length > 0;
    if (cfg.kind === "url") return websiteUrl.trim().length > 0;
    if (cfg.kind === "youtube") return youtubeUrl.trim().length > 0;
    return !!file;
  })();

  const submit = useCallback(async (
    length: "short" | "medium" | "detailed" = "medium",
  ): Promise<{ id: string; response: SummaryResponse; input: SummarizeInput } | null> => {
    const cfg = SOURCES.find((s) => s.id === source)!;
    let payload: SummarizePayload | null = null;
    let vErr: string | null = null;

    if (cfg.kind === "text") {
      vErr = validateText(text);
      if (!vErr) payload = { type: "text", text: text.trim() };
    } else if (cfg.id === "github") {
      if (!websiteUrl.toLowerCase().includes("github.com")) {
        vErr = "Please enter a valid GitHub repository URL.";
      } else {
        vErr = validateUrl(websiteUrl);
      }
      if (!vErr) payload = { type: "github", url: websiteUrl.trim() };
    } else if (cfg.kind === "url") {
      vErr = validateUrl(websiteUrl);
      if (!vErr) payload = { type: "website", url: websiteUrl.trim() };
    } else if (cfg.kind === "youtube") {
      vErr = validateYouTubeUrl(youtubeUrl);
      if (!vErr) payload = { type: "youtube", url: youtubeUrl.trim() };
    } else if (cfg.kind === "file") {
      if (!file) {
        vErr = "Please choose a file to upload.";
      } else {
        vErr = validateFile(file, cfg);
      }
      if (!vErr && file) {
        payload = { type: cfg.id as any, file };
      }
    }

    if (vErr || !payload) {
      setError(vErr);
      toast.error(vErr ?? "Invalid input");
      return null;
    }

    setError(null);
    setResult(null);
    setStatus("loading");
    try {
      const data = await summarize(payload, length, {
        mode,
        studySubmode,
        customLens: customLens.trim() || undefined,
      });
      setResult(data.response);
      setStatus("success");
      toast.success("Summary ready");
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(msg);
      setStatus("error");
      toast.error(msg);
      return null;
    }
  }, [source, text, websiteUrl, youtubeUrl, file, mode, studySubmode, customLens]);

  return {
    source, changeSource,
    text, setText,
    websiteUrl, setWebsiteUrl,
    youtubeUrl, setYoutubeUrl,
    file, setFile,
    status, result, error,
    canSubmit, submit, clear,
    mode, setMode,
    studySubmode, setStudySubmode,
    customLens, setCustomLens,
  };
}
