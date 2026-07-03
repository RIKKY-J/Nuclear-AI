import { summarizeFn, type SummarizeInput } from "@/lib/summarize.functions";

export interface SummaryResponse {
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  readingTime: string;
  wordCount: number;
  source: string;
  transcriptAvailable?: boolean;
}

export type SummarizePayload =
  | { type: "text"; text: string }
  | { type: "website"; url: string }
  | { type: "youtube"; url: string }
  | { type: "pdf" | "docx" | "txt" | "markdown" | "html"; file: File };

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Encode in chunks to avoid call stack limits on large files.
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(bin);
}

export async function summarize(
  payload: SummarizePayload,
  length: "short" | "medium" | "detailed" = "medium",
): Promise<{ response: SummaryResponse; input: SummarizeInput }> {
  let data: SummarizeInput;
  if (payload.type === "text" || payload.type === "website" || payload.type === "youtube") {
    data = { ...(payload as any), length } as SummarizeInput;
  } else {
    const dataBase64 = await fileToBase64(payload.file);
    data = {
      type: payload.type,
      fileName: payload.file.name,
      mimeType: payload.file.type || "application/octet-stream",
      dataBase64,
      length,
    };
  }
  const response = (await summarizeFn({ data })) as SummaryResponse;
  return { response, input: data };
}
