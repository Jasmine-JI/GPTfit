import { ResultCode } from '../../../enums/common/result-code.enum';
import { AccessRight } from '../../../enums/common/system-accessright.enum';

export interface Api1111Post {
  token: string;
  groupId: string;
  userId: number;
  managerType: AccessRight;
}

export interface Api1111Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
