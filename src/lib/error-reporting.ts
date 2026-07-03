type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[Error Report]", error, {
    route: typeof window !== "undefined" ? window.location.pathname : "server",
    ...context,
  });
}
