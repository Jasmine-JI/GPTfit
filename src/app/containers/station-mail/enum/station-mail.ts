/**
 * 接收對象類別
 */
export enum ReceiverType {
  all = 1,
  assign,
}

/**
 * 訊息種類
 */
export enum MessageType {
  system = 1, // 系統信(自動觸發)
  normal, // 一般信件
  admin, // 管理員手動寄系統信
}

/**
 * 信件讀取狀態
 */
export enum ReadStatus {
  unread = 1,
  read,
}
