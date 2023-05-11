import { AlbumType } from '../../../enums/api';

export interface PostImgInfo {
  albumType: AlbumType;
  fileNameFull: string; // 檔名
  activityFileId?: number; // 運動檔案流水編號
  id?: number; // 官方活動流水編號
}
