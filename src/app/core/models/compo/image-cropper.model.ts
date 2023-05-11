import { AlbumType } from '../../enums/api';

export interface CropperResult {
  // 圖片裁切動作（有可能未變更圖片，故complete代表新圖，close代表純粹關閉裁切視窗）
  action: 'close' | 'complete' | null;
  img: {
    albumType: AlbumType;
    base64: string | null;
    origin: string | null; // 圖片原圖
  };
}
