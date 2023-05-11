import { PhotoTargetType, AlbumType } from '../../../enums/api';
import { ProcessResult } from '../api-common';
import { PostImgInfo } from './api-80xx-common';

export type Api8001Post = FormData;

/**
export interface Api8001Post {
  token: string;
  targetType: PhotoTargetType;
  targetGroupId?: string;
  targetEventId?: number;
  img: Array<PostImgInfo>;
}
*/

export interface Api8001Response {
  processResult: ProcessResult;
  img: Array<{
    albumType: AlbumType;
    url: string;
    activityFileId?: number; // 運動檔案流水編號
    id?: number; // 官方活動流水編號
  }>;
}
