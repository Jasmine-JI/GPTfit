import { ResultCode } from '../../../enums/common/result-code.enum';

export interface Api1117Post {
  token: string;
  groupId: string;
  allMembers: Array<number>;
}

export interface Api1117Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    sameGroupMembers: Array<number>;
  };
}
