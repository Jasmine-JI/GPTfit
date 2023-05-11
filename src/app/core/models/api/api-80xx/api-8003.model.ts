import { PhotoTargetType, AlbumType } from '../../../enums/api';
import { ProcessResult } from '../api-common';

export interface Api8003Post {
  token: string;
  perform: PhotoTargetType;
  targetGroupId?: string;
  albumType: AlbumType;
  page: Page;
}

export interface Api8003Response {
  processResult: ProcessResult;
  img: Array<{
    url: string;
    uploadTimestamp: number;
    activityFileId: number;
  }>;
  page: Page;
}

interface Page {
  counts: number; // 單頁顯示數目
  index: number; // 頁次
}
