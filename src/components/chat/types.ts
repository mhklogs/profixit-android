export interface ChatRow {
  id: string;
  job_id: string | null;
  homeowner_id: string;
  contractor_id: string;
  type: 'job' | 'support';
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ChatListItemData {
  chatId: string;
  jobTitle: string | null;
  counterpartName: string;
  counterpartSubtitle: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export type OrArray<T> = T | T[];

export function first<T>(value: OrArray<T> | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}