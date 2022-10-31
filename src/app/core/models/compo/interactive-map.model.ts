/**
 * 跑者標記設定
 */
export interface MarkerOption {
  name: string;
  imgUrl: string;
  color: string;
}

/**
 * 跑者資訊
 */
export interface RacerInfo {
  name: string;
  fileId: number;
  imgUrl: string;
  color: string;
}

/**
 * 所有跑者位置清單
 */
export type RacerPositionList = Map<number, [number, number]>;
