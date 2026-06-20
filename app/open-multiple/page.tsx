"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, MessageCircle, RotateCcw, X } from "lucide-react";
import {
  OPENED_KEY,
  readOpenedIds,
  readStaged,
  setOpenedIds,
  STAGE_KEY,
  writeBatch,
  type OpenEntry,
} from "@/lib/store/open-multiple";

const BATCH_SIZES = [10, 20, 40];

export default function OpenMultiplePage() {
  const [entries, setEntries] = useState<OpenEntry[]>([]);
  const [opened, setOpened] = useState<Set<number>>(new Set());

  // Nạp danh sách + đánh dấu; đồng bộ khi dashboard stage danh sách mới (storage event).
  useEffect(() => {
    setEntries(readStaged());
    setOpened(new Set(readOpenedIds()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STAGE_KEY || e.key === null) {
        setEntries(readStaged());
        setOpened(new Set(readOpenedIds()));
      } else if (e.key === OPENED_KEY) {
        setOpened(new Set(readOpenedIds()));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Mỗi đợt mở = MỘT TAB TRÌNH DUYỆT MỚI: handoff theo token, mở /messages?batch=token.
  // Tab mới mở đúng đợt này thành tab trong app (cơ chế giữ nguyên). Không trộn tab cũ.
  const openList = useCallback((list: OpenEntry[]) => {
    if (list.length === 0) return;
    const token =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    writeBatch(token, list);
    window.open(`/messages?batch=${token}`, `dora-batch-${token}`);
    setOpened((prev) => {
      const next = new Set(prev);
      for (const e of list) next.add(e.id);
      setOpenedIds([...next]);
      return next;
    });
  }, []);

  const remaining = entries.filter((e) => !opened.has(e.id));

  const openNext = (n: number) => openList(remaining.slice(0, n));
  const openAll = () => openList(remaining);

  const reset = () => {
    setOpenedIds([]);
    setOpened(new Set());
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-12 md:py-14">
        <button
          type="button"
          onClick={() => window.close()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Đóng tab
        </button>

        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Mở nhiều hội thoại
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entries.length} hội thoại — còn lại{" "}
          <span className="font-bold text-foreground">{remaining.length}</span> chưa mở,{" "}
          <span className="font-bold text-success">{entries.length - remaining.length}</span> đã mở.
          Mỗi lần mở sẽ bật một tab trình duyệt mới; bấm từng dòng để mở lẻ.
        </p>

        {/* Nút mở */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openAll}
            disabled={remaining.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <ExternalLink className="h-4 w-4" />
            Mở tất cả ({remaining.length})
          </button>
          {BATCH_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => openNext(n)}
              disabled={remaining.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            >
              Mở {n}
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            disabled={entries.length === remaining.length}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        {/* Danh sách */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Không có hội thoại nào. Hãy mở lại từ Dashboard.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {entries.slice(0, 200).map((e, idx) => {
                const isOpened = opened.has(e.id);
                return (
                  <li key={e.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                    <span className="w-6 shrink-0 text-xs text-muted-foreground">{idx + 1}</span>
                    {isOpened ? (
                      <Check className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <button
                      type="button"
                      onClick={() => openList([e])}
                      title="Mở hội thoại này ở tab mới"
                      className={`min-w-0 flex-1 truncate text-left font-bold transition-colors hover:text-primary ${
                        isOpened ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {e.name || `Hội thoại ${e.id}`}
                    </button>
                    <span className="shrink-0 text-xs text-muted-foreground">#{e.id}</span>
                    <button
                      type="button"
                      onClick={() => openList([e])}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-accent"
                    >
                      {isOpened ? "Mở lại" : "Mở"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {entries.length > 200 && (
            <div className="px-6 py-3 text-center text-xs text-muted-foreground">
              + {entries.length - 200} hội thoại khác
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
