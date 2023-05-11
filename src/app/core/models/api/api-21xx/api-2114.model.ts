import { PrivacyObj, PrivacyEditObj, RangeType } from '../../../enums/api';

export interface Api2114Post {
  token: string;
  targetUserId?: number;
  editFileType: PrivacyEditObj;
  rangeType: RangeType;
  editFileId?: Array<number>;
  startTime?: string;
  endTime?: string;
  privacy: Array<PrivacyObj>;
}

export interface Api2114Response {
  alaFormatVersionName: string;
  resultCode: number;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
