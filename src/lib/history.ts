import { useEffect, useState } from "react";
import type { SummaryResponse } from "@/services/api";
import type { SummarizeInput } from "./summarize.functions";

export interface HistoryItem {
  id: string;
  createdAt: number;
  preview: string;
  response: SummaryResponse;
  input?: SummarizeInput;
  length?: "short" | "medium" | "detailed";
  summaries?: {
    short?: SummaryResponse;
    medium?: SummaryResponse;
    detailed?: SummaryResponse;
  };
}

const KEY = "nuclear:history";
const listeners = new Set<() => void>();

function read(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]) {
  sessionStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function addHistory(
  response: SummaryResponse,
  input: SummarizeInput,
  length: "short" | "medium" | "detailed",
  preview: string,
): HistoryItem {
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    preview: preview.slice(0, 140),
    response,
    input,
    length,
    summaries: {
      [length]: response,
    },
  };
  write([item, ...read()].slice(0, 50));
  return item;
}

export function updateHistoryItem(id: string, updates: Partial<HistoryItem>) {
  const items = read();
  const index = items.findIndex((x) => x.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    write(items);
  }
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  return read().find((x) => x.id === id);
}

export function removeHistory(id: string) {
  write(read().filter((x) => x.id !== id));
}

export function clearHistory() {
  write([]);
}

export function useHistory(): HistoryItem[] {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    const update = () => setItems(read());
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return items;
}
