/**
 * Luồng "mở nhiều hội thoại".
 *
 * Trang /open-multiple mở ở MỘT TAB TRÌNH DUYỆT RIÊNG (bảng điều khiển). Dữ liệu đi qua
 * localStorage vì sessionStorage không chia sẻ giữa các tab trình duyệt.
 *
 *  1. Panel dashboard → stage() → window.open("/open-multiple") (bảng điều khiển).
 *  2. Mỗi lần bấm "Mở N"/"Mở lẻ" trên bảng → writeBatch(token) + window.open("/messages?batch=token")
 *     thành MỘT TAB TRÌNH DUYỆT MỚI. Tab đó mở N hội thoại thành tab trong app (openMany).
 *     Bảng ở lại để đánh dấu hội thoại đã mở (reset được).
 */

/** 1 hội thoại cần mở (kèm meta để hiện tên/avatar trên tab). */
export interface OpenEntry {
  id: number;
  name?: string;
  avatar?: string;
}

const STAGE_KEY = "messenger.openMultiple.v1";
const OPENED_KEY = "messenger.openedMarks.v1";
const BATCH_PREFIX = "messenger.batch.";

function read(key: string): OpenEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((e) => e && Number.isFinite(e.id));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Chặng 1: lưu danh sách để bảng /open-multiple hiển thị; reset đánh dấu cũ. */
export function stageOpenMultiple(entries: OpenEntry[]): void {
  write(STAGE_KEY, entries);
  remove(OPENED_KEY);
}
export function readStaged(): OpenEntry[] {
  return read(STAGE_KEY);
}
export function clearStaged(): void {
  remove(STAGE_KEY);
}

/** Chặng 2: handoff 1 đợt mở (token riêng) cho tab /messages mới nhặt rồi xoá. */
export function writeBatch(token: string, entries: OpenEntry[]): void {
  write(BATCH_PREFIX + token, entries);
}
export function readBatch(token: string): OpenEntry[] {
  return read(BATCH_PREFIX + token);
}
export function clearBatch(token: string): void {
  remove(BATCH_PREFIX + token);
}

/** Đánh dấu các hội thoại đã mở (để batch không mở lại). Reset = xoá. */
export function readOpenedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OPENED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((n) => Number.isFinite(n));
  } catch {
    /* ignore */
  }
  return [];
}
export function setOpenedIds(ids: number[]): void {
  write(OPENED_KEY, ids);
}
export function clearOpenedIds(): void {
  remove(OPENED_KEY);
}

export { STAGE_KEY, OPENED_KEY };
