import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { getDb } from "./db";

export const getChatHistoryFn = createServerFn({ method: "GET" })
  .input(z.object({ summaryId: z.string() }))
  .handler(async ({ input }) => {
    const db = await getDb();
    const rows = db
      .prepare("SELECT role, content, createdAt FROM chats WHERE summaryId = ? ORDER BY createdAt ASC")
      .all(input.summaryId) as any[];

    return rows.map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
      createdAt: row.createdAt,
    }));
  });

export const sendChatMessageFn = createServerFn({ method: "POST" })
  .input(z.object({ summaryId: z.string(), message: z.string() }))
  .handler(async ({ input }) => {
    const db = await getDb();
    const { summaryId, message } = input;

    // 1. Fetch summary context
    const summary = db.prepare("SELECT * FROM summaries WHERE id = ?").get(summaryId) as any;
    if (!summary) throw new Error("Document not found.");

    const resData = JSON.parse(summary.response);
    const inputData = JSON.parse(summary.input);

    // 2. Fetch past conversation
    const history = db
      .prepare("SELECT role, content FROM chats WHERE summaryId = ? ORDER BY createdAt ASC")
      .all(summaryId) as any[];

    // 3. Construct system prompt and grounding details
    const groundingText = [
      `Document Title: ${resData.title}`,
      `Executive Summary: ${resData.summary}`,
      `Key Points:\n${resData.keyPoints.map((p: string) => `- ${p}`).join("\n")}`,
      inputData.text ? `Original Text Content:\n${inputData.text.slice(0, 100_000)}` : "",
      inputData.url ? `Original Source URL: ${inputData.url}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const systemPrompt = `You are Nuclear AI Chatbot, a helpful, precise assistant.
You are conversing with a user about the document summarized below.
Ground all your answers strictly in the document content provided. If the answer cannot be found in the provided context, state that you do not have enough information from the document to answer, but try to offer relevant general help if possible.

Document Grounding Context:
=========================================
${groundingText}
=========================================`;

    // 4. Load AI models
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");

    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google("gemini-2.5-flash");

    // Form messages list
    const messages = [
      ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message },
    ];

    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: messages as any,
    });

    const userMsgId = `msg_${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const assistantMsgId = `msg_${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`;

    // Save to Database
    db.prepare("INSERT INTO chats (id, summaryId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(
      userMsgId,
      summaryId,
      "user",
      message,
      Date.now(),
    );

    db.prepare("INSERT INTO chats (id, summaryId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(
      assistantMsgId,
      summaryId,
      "assistant",
      text,
      Date.now() + 10,
    );

    return {
      role: "assistant" as const,
      content: text,
      createdAt: Date.now() + 10,
    };
  });
