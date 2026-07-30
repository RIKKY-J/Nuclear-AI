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
  actionItems?: string[];
  openQuestions?: string[];
  complexity?: {
    language: string;
    purposeOverview: string;
    algorithmBreakdown: string[];
    timeComplexity: string;
    spaceComplexity: string;
    dependencies: string[];
    potentialIssues: string[];
  };
  repoDetails?: {
    repoName: string;
    primaryLanguage: string;
    architectureOverview: string;
    keyDependencies: string[];
    setupInstructions: string;
  };
  studyOutput?: {
    notes?: string[];
    flashcards?: { front: string; back: string }[];
    qa?: { question: string; answer: string }[];
  };
  coverageNote?: string;
}

export type SummarizePayload =
  | { type: "text"; text: string }
  | { type: "website"; url: string }
  | { type: "youtube"; url: string }
  | { type: "github"; url: string }
  | { type: "pdf" | "docx" | "txt" | "markdown" | "html" | "audio"; file: File };

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

export async function summarize(
  payload: SummarizePayload,
  length: "short" | "medium" | "detailed" = "medium",
  options?: {
    mode?: "standard" | "study" | "code";
    studySubmode?: "notes" | "flashcards" | "qa";
    customLens?: string;
  },
): Promise<{ id: string; response: SummaryResponse; input: SummarizeInput }> {
  let data: SummarizeInput;

  if (
    payload.type === "text" ||
    payload.type === "website" ||
    payload.type === "youtube" ||
    payload.type === "github"
  ) {
    data = {
      type: payload.type,
      ...(payload.type === "text" ? { text: payload.text } : { url: payload.url }),
      length,
      ...options,
    } as SummarizeInput;
  } else {
    const dataBase64 = await fileToBase64(payload.file);
    data = {
      type: payload.type,
      fileName: payload.file.name,
      mimeType: payload.file.type || "application/octet-stream",
      dataBase64,
      length,
      ...options,
    };
  }

  const res = (await summarizeFn({ data })) as { id: string; response: SummaryResponse };
  return { id: res.id, response: res.response, input: data };
}
