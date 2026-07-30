import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { getChatHistoryFn, sendChatMessageFn } from "@/lib/chat.functions";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export default function ChatPanel({
  summaryId,
  onClose,
}: {
  summaryId: string;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getChatHistoryFn({ summaryId });
        setMessages(history);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load chat history.");
      } finally {
        setFetchingHistory(false);
      }
    };
    fetchHistory();
  }, [summaryId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userText = inputMsg.trim();
    setInputMsg("");
    setLoading(true);

    // Optimistically add user message
    const userMsg: Message = {
      role: "user",
      content: userText,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendChatMessageFn({ summaryId, message: userText });
      setMessages((prev) => [...prev, res]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] w-full rounded-2xl border border-border bg-panel/75 backdrop-blur shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between bg-background/50 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Chat with Document</h4>
            <p className="text-[10px] text-muted-foreground">AI is grounded in your document</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {fetchingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading conversation history…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-3">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <h5 className="font-semibold text-sm">Ask a question</h5>
            <p className="text-xs max-w-xs mt-1 text-muted-foreground/80">
              Type a question below to query specific points, clarify details, or extract definitions from the document.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={["flex w-full", isUser ? "justify-end" : "justify-start"].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                      : "bg-background/80 border border-border text-foreground rounded-tl-none",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 max-w-[85%] rounded-2xl bg-background/80 border border-border px-4 py-3 text-sm text-muted-foreground rounded-tl-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>AI is thinking…</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="border-t border-border p-3 bg-background/30 flex gap-2">
        <input
          type="text"
          value={inputMsg}
          disabled={loading || fetchingHistory}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask a question about this document…"
          className="flex-1 rounded-xl border border-border bg-panel/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputMsg.trim() || fetchingHistory}
          className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-xl bg-primary text-primary-foreground shadow glow-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
