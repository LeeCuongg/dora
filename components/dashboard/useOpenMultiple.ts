"use client";

import { useCallback } from "react";
import { stageOpenMultiple, type OpenEntry } from "@/lib/store/open-multiple";
import type { UnreadConvItem } from "@/lib/types/etsy";

/**
 * Hook trả về hàm mở nhiều hội thoại: stage danh sách rồi MỞ TAB TRÌNH DUYỆT MỚI
 * tới bảng điều khiển /open-multiple. (Tin nhắn vẫn mở thành tab trong app từ bảng đó.)
 *
 * Dùng window name cố định để bấm nhiều lần chỉ tái sử dụng 1 tab điều khiển.
 */
export function useOpenMultiple() {
  return useCallback((convs: UnreadConvItem[], count?: number) => {
    if (!convs || convs.length === 0) return;
    const slice = typeof count === "number" ? convs.slice(0, count) : convs;
    const entries: OpenEntry[] = slice.map((c) => ({
      id: c.conversationId,
      name: c.name,
      avatar: c.avatar,
    }));
    stageOpenMultiple(entries);
    if (typeof window !== "undefined") {
      window.open("/open-multiple", "dora-open-multiple");
    }
  }, []);
}
