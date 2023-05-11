import { PhotoTargetType, AlbumType } from '../../../enums/api';
import { ProcessResult } from '../api-common';
import { PostImgInfo } from './api-80xx-common';

export interface Api8002Post {
  token: string;
  targetType: PhotoTargetType;
  targetGroupId?: string;
  targetEventId?: number;
  img: Array<PostImgInfo>;
}

export interface Api8002Response {
  processResult: ProcessResult;
}
