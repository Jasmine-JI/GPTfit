import { ResultCode } from '../../../enums/common/result-code.enum';
import { AccessRight } from '../../../enums/common/system-accessright.enum';

export interface Api1106Post {
  token: string;
  groupId: string;
  userId: number;
  accessRight: AccessRight;
}

export interface Api1106Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
