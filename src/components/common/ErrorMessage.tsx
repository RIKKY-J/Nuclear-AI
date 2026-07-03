import { AlertTriangle } from "lucide-react";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
      <div className="text-destructive-foreground/90">{message}</div>
    </div>
  );
}
