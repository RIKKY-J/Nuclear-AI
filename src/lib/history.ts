import { useEffect, useState } from "react";
import type { SummaryResponse } from "@/services/api";
import type { SummarizeInput } from "./summarize.functions";
import {
  getHistoryListFn,
  toggleFavoriteFn,
  deleteSummaryFn,
  clearUserHistoryFn,
  syncAnonymousHistoryFn,
} from "./history.functions";
import { getCurrentUserFn } from "./auth.functions";

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
  favorite?: boolean;
  sourceType?: string;
}

const KEY = "nuclear:history";
const listeners = new Set<() => void>();

function readLocal(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function addHistory(
  response: SummaryResponse,
  input: SummarizeInput,
  length: "short" | "medium" | "detailed",
  preview: string,
  serverGeneratedId?: string,
): HistoryItem {
  const item: HistoryItem = {
    id: serverGeneratedId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    preview: preview.slice(0, 140),
    response,
    input,
    length,
    sourceType: input.type,
    summaries: {
      [length]: response,
    },
    favorite: false,
  };
  writeLocal([item, ...readLocal()].slice(0, 50));
  return item;
}

export function updateHistoryItem(id: string, updates: Partial<HistoryItem>) {
  const items = readLocal();
  const index = items.findIndex((x) => x.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    writeLocal(items);
  }
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  return readLocal().find((x) => x.id === id);
}

export async function removeHistory(id: string) {
  writeLocal(readLocal().filter((x) => x.id !== id));
  try {
    await deleteSummaryFn({ data: { id } });
  } catch (e) {
    console.error("Could not delete from server", e);
  }
}

export async function clearHistory() {
  writeLocal([]);
  try {
    await clearUserHistoryFn();
  } catch (e) {
    console.error("Could not clear user history from server", e);
  }
}

export function useHistory(): HistoryItem[] {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<any>(null);

  const refreshHistory = async () => {
    try {
      const activeUser = await getCurrentUserFn();
      setUser(activeUser);

      if (activeUser) {
        // Sync any anonymous local history first
        const localItems = readLocal();
        const anonymousIds = localItems.map((item) => item.id);
        if (anonymousIds.length > 0) {
          await syncAnonymousHistoryFn({ data: { ids: anonymousIds } });
          // Clear local storage after successful sync to avoid duplicated listing
          sessionStorage.removeItem(KEY);
        }

        const serverItems = await getHistoryListFn();
        setItems(serverItems as HistoryItem[]);
      } else {
        setItems(readLocal());
      }
    } catch (e) {
      console.error(e);
      setItems(readLocal());
    }
  };

  useEffect(() => {
    refreshHistory();

    const handleUpdate = () => {
      if (!user) {
        setItems(readLocal());
      }
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [user]);

  return items;
}
