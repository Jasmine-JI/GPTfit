/**
 * 接收者概要
 */
export interface Receiver {
  id: string | number;
  name: string;
  avatarUrl?: string;
  isGroup?: boolean;
}

/**
 * 轉寄信件概要資訊
 */
export interface ReplyMailInfo {
  id: number | null;
  name: string | null;
  avatarUrl?: string | null;
  title: string | null;
  content: string | null;
  replyMessageId?: Array<number> | null;
}