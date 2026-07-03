import { createServerFn } from "@tanstack/react-start";
import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

const SummarySchema = z.object({
  title: z.string(),
  summary: z.array(z.string()),
  keyPoints: z.array(z.string()),
  keywords: z.array(z.string()),
  wordCount: z.number(),
});

export type SummarizeInput =
  | { type: "text"; text: string; length?: "short" | "medium" | "detailed" }
  | { type: "website"; url: string; length?: "short" | "medium" | "detailed" }
  | { type: "youtube"; url: string; length?: "short" | "medium" | "detailed" }
  | {
      type: "pdf" | "docx" | "txt" | "markdown" | "html";
      fileName: string;
      mimeType: string;
      // base64-encoded file bytes
      dataBase64: string;
      length?: "short" | "medium" | "detailed";
    };

const SYSTEM_PROMPT = `You are Nuclear AI, an expert summarizer.
Return a clear, structured JSON summary. Rules:
- title: a short descriptive title (max 90 chars).
- summary: 3-5 tight paragraphs, factual and neutral.
- keyPoints: 4-7 bullet-worthy sentences.
- keywords: 5-10 short topical keywords.
- wordCount: your best estimate of the ORIGINAL source's word count (integer).`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return m ? m[1] : null;
}

async function fetchWebsiteText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NuclearAI/1.0; +https://nuclearai.app)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Could not fetch page (HTTP ${res.status}).`);
  const html = await res.text();
  const text = stripHtml(html);
  if (text.length < 100) throw new Error("Page had no readable text.");
  return text.slice(0, 60_000);
}

async function fetchYoutubeContext(url: string): Promise<string> {
  const id = extractYoutubeId(url);
  if (!id) throw new Error("Invalid YouTube URL.");
  // Use oEmbed for reliable title/author, then fetch page for description.
  const oembedRes = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
  );
  let title = "";
  let author = "";
  if (oembedRes.ok) {
    const j = (await oembedRes.json()) as { title?: string; author_name?: string };
    title = j.title ?? "";
    author = j.author_name ?? "";
  }
  let description = "";
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en" },
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const meta = html.match(
        /<meta name="description" content="([^"]+)"/,
      );
      if (meta) description = meta[1];
    }
  } catch {
    /* ignore */
  }
  if (!title && !description) {
    throw new Error("Could not read this YouTube video's metadata.");
  }
  return [
    `YouTube video: ${title}`,
    author && `Channel: ${author}`,
    description && `Description: ${description}`,
    `URL: ${url}`,
    "",
    "Note: only the video's public metadata is available (no transcript). Summarize based on the title, channel, and description.",
  ]
    .filter(Boolean)
    .join("\n");
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function fetchYoutubeTranscriptText(id: string): Promise<string> {
  try {
    const list = await YoutubeTranscript.fetchTranscript(id);
    return list.map((item) => item.text).join(" ");
  } catch (err) {
    console.log(
      "Primary youtube-transcript failed, trying youtube-transcript.ai fallback... Error:",
      err instanceof Error ? err.message : err,
    );
    const res = await fetch(`https://youtube-transcript.ai/transcript/${id}.txt`);
    if (!res.ok) {
      throw new Error(`youtube-transcript.ai returned status ${res.status}`);
    }
    const text = await res.text();
    if (!text.includes("## Transcript") && !text.includes("Transcript:")) {
      throw new Error("Invalid transcript response content");
    }
    return text;
  }
}

async function buildUserMessage(
  input: SummarizeInput,
): Promise<{ message: { role: "user"; content: unknown }; transcriptAvailable?: boolean }> {
  if (input.type === "text") {
    return {
      message: {
        role: "user",
        content: `Summarize the following text:\n\n${input.text.slice(0, 200_000)}`,
      },
    };
  }
  if (input.type === "website") {
    const text = await fetchWebsiteText(input.url);
    return {
      message: {
        role: "user",
        content: `Summarize the content of this webpage (${input.url}):\n\n${text}`,
      },
    };
  }
  if (input.type === "youtube") {
    const id = extractYoutubeId(input.url);
    if (!id) throw new Error("Invalid YouTube URL.");

    let transcript = "";
    let transcriptAvailable = false;

    try {
      if (input.url.includes("no_transcript=true")) {
        throw new Error("Simulated transcript unavailable");
      }
      transcript = await fetchYoutubeTranscriptText(id);
      transcriptAvailable = true;
    } catch (err) {
      console.log("Transcript not available for video:", id, err);
      transcriptAvailable = false;
    }

    const metaContext = await fetchYoutubeContext(input.url);
    let fullContext = metaContext;
    if (transcriptAvailable) {
      fullContext += `\n\nTranscript:\n${transcript}\n\nNote: Please prioritize summarizing based on the actual transcript of the video above.`;
    }

    return {
      message: {
        role: "user",
        content: `Summarize this YouTube video:\n\n${fullContext}`,
      },
      transcriptAvailable,
    };
  }

  // File-based sources
  if (
    input.type === "txt" ||
    input.type === "markdown" ||
    input.type === "html"
  ) {
    const raw = new TextDecoder().decode(base64ToBytes(input.dataBase64));
    const text = input.type === "html" ? stripHtml(raw) : raw;
    return {
      message: {
        role: "user",
        content: `Summarize the following ${input.type.toUpperCase()} file (${input.fileName}):\n\n${text.slice(0, 200_000)}`,
      },
    };
  }
  if (input.type === "pdf") {
    return {
      message: {
        role: "user",
        content: [
          { type: "text", text: `Summarize the attached PDF (${input.fileName}).` },
          {
            type: "file",
            data: `data:application/pdf;base64,${input.dataBase64}`,
            mediaType: "application/pdf",
          },
        ],
      },
    };
  }
  if (input.type === "docx") {
    throw new Error(
      "DOCX files aren't supported by the AI yet — please convert to PDF or paste the text.",
    );
  }
  throw new Error("Unsupported source type.");
}

function labelFor(type: SummarizeInput["type"]): string {
  switch (type) {
    case "text":
      return "Plain Text";
    case "website":
      return "Website";
    case "youtube":
      return "YouTube";
    default:
      return type.toUpperCase();
  }
}

export const summarizeFn = createServerFn({ method: "POST" })
  .inputValidator((data: SummarizeInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Missing GEMINI_API_KEY.");

    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google("gemini-2.5-flash");

    const { message, transcriptAvailable } = await buildUserMessage(data);

    const length = data.length || "medium";
    let lengthInstructions = "";
    if (length === "short") {
      lengthInstructions = `- summary: exactly 2-3 short, clear key point sentences (array of strings).
- keyPoints: exactly 2-3 detailed highlight sentences.
- keywords: 3-5 short topical keywords.`;
    } else if (length === "detailed") {
      lengthInstructions = `- summary: exactly 6-8 comprehensive, detailed key point sentences (array of strings).
- keyPoints: 6-10 detailed highlight sentences.
- keywords: 8-12 short topical keywords.`;
    } else {
      // medium
      lengthInstructions = `- summary: exactly 4-5 clear, concise key point sentences (array of strings).
- keyPoints: 4-5 detailed highlight sentences.
- keywords: 5-8 short topical keywords.`;
    }

    const systemPrompt = `You are Nuclear AI, an expert summarizer.
Return a clear, structured JSON summary. Rules:
- title: a short descriptive title (max 90 chars).
${lengthInstructions}
- wordCount: your best estimate of the ORIGINAL source's word count (integer).`;

    try {
      const { object } = await generateObject({
        model,
        schema: SummarySchema,
        system: systemPrompt,
        messages: [message as never],
      });

      const wc = Math.max(1, Math.round(object.wordCount || 0));
      const readMin = Math.max(1, Math.round(wc / 220));
      return {
        title: object.title.slice(0, 140),
        summary: object.summary.map((p) => `- ${p}`).join("\n"),
        keyPoints: object.keyPoints.slice(0, 10),
        keywords: object.keywords.slice(0, 12),
        wordCount: wc,
        readingTime: `${readMin} min`,
        source: labelFor(data.type),
        transcriptAvailable,
      };
    } catch (error) {
      console.error("AI Generation Error details:", error);
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI returned an invalid response. Please try again.");
      }
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg.includes("429") || msg.toLowerCase().includes("rate"))
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402") || msg.toLowerCase().includes("credit"))
        throw new Error(
          "AI credits exhausted for this workspace. Please add credits in workspace billing.",
        );
      throw new Error(msg);
    }
  });
