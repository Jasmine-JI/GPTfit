import { ResultCode } from '../../../enums/common/result-code.enum';

export interface Api1108Post {
  token: string;
  groupId: number;
  userId: number;
}

export interface Api1108Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
