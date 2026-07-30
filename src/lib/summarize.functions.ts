import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";
import mammoth from "mammoth";
import { getDb } from "./db";

// Helper to parse cookies
function parseCookies(req: Request): Record<string, string> {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((str) => {
    const parts = str.split("=");
    if (parts[0] && parts[1]) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    }
  });
  return cookies;
}

const SummarySchema = z.object({
  title: z.string(),
  summary: z.string(), // Prose narrative synthesis
  keyPoints: z.array(z.string()), // Distinct scannable bullet points
  keywords: z.array(z.string()),
  wordCount: z.number(),
  actionItems: z.array(z.string()).optional(),
  openQuestions: z.array(z.string()).optional(),
  complexity: z.object({
    language: z.string(),
    purposeOverview: z.string(),
    algorithmBreakdown: z.array(z.string()),
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
    dependencies: z.array(z.string()),
    potentialIssues: z.array(z.string()),
  }).optional(),
  repoDetails: z.object({
    repoName: z.string(),
    primaryLanguage: z.string(),
    architectureOverview: z.string(),
    keyDependencies: z.array(z.string()),
    setupInstructions: z.string(),
  }).optional(),
  studyOutput: z.object({
    notes: z.array(z.string()).optional(),
    flashcards: z.array(z.object({ front: z.string(), back: z.string() })).optional(),
    qa: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  }).optional(),
  coverageNote: z.string().optional(),
});

export type SummarizeInput = {
  type: "text" | "website" | "youtube" | "pdf" | "docx" | "txt" | "markdown" | "html" | "github" | "audio";
  text?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  dataBase64?: string;
  length?: "short" | "medium" | "detailed";
  mode?: "standard" | "study" | "code";
  studySubmode?: "notes" | "flashcards" | "qa";
  customLens?: string;
  language?: string;
};

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

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!m) return null;
  const owner = m[1];
  let repo = m[2];
  if (repo.endsWith(".git")) repo = repo.slice(0, -4);
  return { owner, repo };
}

async function fetchGithubRepoDetails(url: string) {
  const parsed = parseGithubUrl(url);
  if (!parsed) throw new Error("Invalid GitHub URL.");
  const { owner, repo } = parsed;

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) throw new Error(`Could not fetch GitHub repo info (HTTP ${repoRes.status}).`);
  const repoData = (await repoRes.json()) as any;

  let readme = "";
  const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
  if (readmeRes.ok) {
    const readmeData = (await readmeRes.json()) as any;
    if (readmeData.content) {
      readme = atob(readmeData.content.replace(/\s/g, ""));
    }
  }

  let structure = "";
  const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
  if (contentsRes.ok) {
    const contentsData = (await contentsRes.json()) as any[];
    structure = contentsData.map((f) => `${f.type === "dir" ? "[DIR]" : "[FILE]"} ${f.name}`).join("\n");
  }

  return {
    repoName: `${owner}/${repo}`,
    stars: repoData.stargazers_count || 0,
    primaryLanguage: repoData.language || "Unknown",
    readme: readme.slice(0, 40000),
    structure,
  };
}

async function buildUserMessage(
  input: SummarizeInput,
): Promise<{ message: { role: "user"; content: unknown }; transcriptAvailable?: boolean; coverageNote?: string }> {
  if (input.type === "text") {
    return {
      message: {
        role: "user",
        content: `Summarize the following text:\n\n${input.text?.slice(0, 200_000)}`,
      },
    };
  }
  if (input.type === "website") {
    const text = await fetchWebsiteText(input.url!);
    return {
      message: {
        role: "user",
        content: `Summarize the content of this webpage (${input.url}):\n\n${text}`,
      },
    };
  }
  if (input.type === "youtube") {
    const id = extractYoutubeId(input.url!);
    if (!id) throw new Error("Invalid YouTube URL.");

    let transcript = "";
    let transcriptAvailable = false;

    try {
      if (input.url?.includes("no_transcript=true")) {
        throw new Error("Simulated transcript unavailable");
      }
      transcript = await fetchYoutubeTranscriptText(id);
      transcriptAvailable = true;
    } catch (err) {
      console.log("Transcript not available for video:", id, err);
      transcriptAvailable = false;
    }

    const metaContext = await fetchYoutubeContext(input.url!);
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
      coverageNote: transcriptAvailable ? undefined : "Metadata-only summary — video transcript unavailable.",
    };
  }

  if (input.type === "github") {
    const details = await fetchGithubRepoDetails(input.url!);
    const content = [
      `Repository: ${details.repoName}`,
      `Stars: ${details.stars}`,
      `Primary Language: ${details.primaryLanguage}`,
      `Structure:\n${details.structure}`,
      `README:\n${details.readme}`,
    ].join("\n\n");

    return {
      message: {
        role: "user",
        content: `Analyze this GitHub Repository:\n\n${content}`,
      },
    };
  }

  // File-based sources
  if (
    input.type === "txt" ||
    input.type === "markdown" ||
    input.type === "html"
  ) {
    const raw = new TextDecoder().decode(base64ToBytes(input.dataBase64!));
    const text = input.type === "html" ? stripHtml(raw) : raw;
    return {
      message: {
        role: "user",
        content: `Summarize the following ${input.type.toUpperCase()} file (${input.fileName}):\n\n${text.slice(0, 200_000)}`,
      },
    };
  }
  if (input.type === "docx") {
    const rawText = await mammoth.extractRawText({
      buffer: Buffer.from(input.dataBase64!, "base64"),
    }).then((res) => res.value);

    return {
      message: {
        role: "user",
        content: `Summarize the following DOCX document (${input.fileName}):\n\n${rawText.slice(0, 200_000)}`,
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
  if (input.type === "audio") {
    return {
      message: {
        role: "user",
        content: [
          { type: "text", text: `Transcribe and summarize the attached audio file (${input.fileName}).` },
          {
            type: "file",
            data: `data:${input.mimeType};base64,${input.dataBase64}`,
            mediaType: input.mimeType!,
          },
        ],
      },
    };
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
    case "github":
      return "GitHub Repository";
    case "audio":
      return "Audio Recording";
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

    const { message, transcriptAvailable, coverageNote } = await buildUserMessage(data);

    const length = data.length || "medium";
    let lengthInstructions = "";
    if (length === "short") {
      lengthInstructions = `- summary: exactly 1-2 cohesive prose sentences.
- keyPoints: exactly 2-3 detailed scannable bullet point highlights.
- keywords: 3-5 short topical keywords.`;
    } else if (length === "detailed") {
      lengthInstructions = `- summary: exactly 2-3 cohesive prose paragraphs explaining the narrative in depth.
- keyPoints: exactly 6-10 comprehensive bullet point highlights.
- keywords: 8-12 short topical keywords.`;
    } else {
      // medium
      lengthInstructions = `- summary: exactly 1 cohesive prose paragraph.
- keyPoints: exactly 4-5 scannable bullet point highlights.
- keywords: 5-8 short topical keywords.`;
    }

    const mode = data.mode || "standard";
    let modePrompt = "";
    if (mode === "study") {
      const sub = data.studySubmode || "notes";
      modePrompt = `
Additional Instructions:
- mode: "study".
- You MUST populate the \`studyOutput\` field in the schema based on submode: "${sub}".
- If submode is "notes", populate \`studyOutput.notes\` with comprehensive, headed hierarchical study notes.
- If submode is "flashcards", populate \`studyOutput.flashcards\` with a list of front (question/term) and back (answer/definition) card pairs.
- If submode is "qa", populate \`studyOutput.qa\` with a list of sample exam questions and model answers.`;
    } else if (mode === "code") {
      modePrompt = `
Additional Instructions:
- mode: "code".
- You MUST populate the \`complexity\` field with the language, purposeOverview, algorithmBreakdown, timeComplexity, spaceComplexity, dependencies, and potentialIssues.`;
    } else if (data.type === "github") {
      modePrompt = `
Additional Instructions:
- mode: "github".
- You MUST populate the \`repoDetails\` field with repository details including repoName, primaryLanguage, architectureOverview, keyDependencies, and setupInstructions.`;
    }

    let lensPrompt = "";
    if (data.customLens) {
      lensPrompt = `
Custom Lens Parameter:
- Focus the summary heavily on this requested perspective: "${data.customLens}". Still preserve the JSON structure, but steer all contents to highlight this angle.`;
    }

    let languagePrompt = "";
    if (data.language) {
      languagePrompt = `
Translation Instruction:
- You MUST output the title, summary, keyPoints, actionItems, openQuestions, complexity text fields, and studyOutput text/notes/flashcards fully translated into: "${data.language}".`;
    }

    const systemPrompt = `You are Nuclear AI, an expert summarizer and information architect.
Return a clear, structured JSON object conforming precisely to the requested schema.

General Rules:
- title: a short descriptive title (max 90 chars).
- summary: Cohesive prose written in a natural reading flow. Do NOT use bullet points or prefix lines with checkmarks or dash indicators.
- keyPoints: List of discrete, scannable facts and key takeaways.
- wordCount: your best estimate of the ORIGINAL source's word count (integer).
- actionItems: Extract concrete next steps or actionable items if present.
- openQuestions: Extract unresolved details, questions, or gaps raised in the content.
- coverageNote: If the source material was truncated or only metadata was parsed, explain that here.

Length Guidelines:
${lengthInstructions}
${modePrompt}
${lensPrompt}
${languagePrompt}`;

    try {
      const { object } = await generateObject({
        model,
        schema: SummarySchema,
        system: systemPrompt,
        messages: [message as never],
      });

      const wc = Math.max(1, Math.round(object.wordCount || 0));
      const readMin = Math.max(1, Math.round(wc / 220));

      const responsePayload = {
        title: object.title.slice(0, 140),
        summary: object.summary, // Return as prose string
        keyPoints: object.keyPoints.slice(0, 15),
        keywords: object.keywords.slice(0, 15),
        wordCount: wc,
        readingTime: `${readMin} min`,
        source: labelFor(data.type),
        transcriptAvailable,
        actionItems: object.actionItems,
        openQuestions: object.openQuestions,
        complexity: object.complexity,
        repoDetails: object.repoDetails,
        studyOutput: object.studyOutput,
        coverageNote: object.coverageNote || coverageNote,
      };

      // Get user session to associate
      const req = getRequest();
      const cookies = parseCookies(req);
      const sessionId = cookies["session_id"];
      let userId: string | null = null;

      if (sessionId) {
        const db = await getDb();
        const session = db.prepare("SELECT userId FROM sessions WHERE id = ? AND expiresAt > ?").get(sessionId, Date.now()) as any;
        if (session) {
          userId = session.userId;
        }
      }

      // Save to SQLite database
      const summaryId = `sum_${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const db = await getDb();
      db.prepare(`
        INSERT INTO summaries (id, userId, createdAt, preview, input, response, length, sourceType, favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        summaryId,
        userId,
        Date.now(),
        responsePayload.title,
        JSON.stringify(data),
        JSON.stringify(responsePayload),
        length,
        data.type,
      );

      return {
        id: summaryId,
        response: responsePayload,
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

export const getPreviewMetadataFn = createServerFn({ method: "POST" })
  .input(
    z.object({
      type: z.enum(["website", "youtube", "github"]),
      url: z.string().url(),
    }),
  )
  .handler(async ({ input }) => {
    const { type, url } = input;

    if (type === "website") {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) throw new Error("Fetch failed");
        const html = await res.text();
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

        const hostname = new URL(url).hostname;
        const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;

        return { type, title, favicon, description: hostname };
      } catch {
        const hostname = new URL(url).hostname;
        return {
          type,
          title: hostname,
          favicon: `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`,
          description: "Website",
        };
      }
    }

    if (type === "youtube") {
      const id = extractYoutubeId(url);
      if (!id) throw new Error("Invalid YouTube URL");

      let title = "YouTube Video";
      let author = "YouTube Channel";
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      );
      if (oembedRes.ok) {
        const j = (await oembedRes.json()) as any;
        title = j.title || title;
        author = j.author_name || author;
      }

      const thumbnail = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
      return { type, title, author, thumbnail, duration: "Video" };
    }

    if (type === "github") {
      const parsed = parseGithubUrl(url);
      if (!parsed) throw new Error("Invalid GitHub URL");
      const { owner, repo } = parsed;

      try {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoRes.ok) throw new Error("Fetch failed");
        const repoData = (await repoRes.json()) as any;

        return {
          type,
          title: `${owner}/${repo}`,
          stars: repoData.stargazers_count || 0,
          primaryLanguage: repoData.language || "Unknown",
          description: repoData.description || "GitHub Repository",
        };
      } catch {
        return {
          type,
          title: `${owner}/${repo}`,
          stars: 0,
          primaryLanguage: "Unknown",
          description: "GitHub Repository",
        };
      }
    }

    throw new Error("Invalid type");
  });

