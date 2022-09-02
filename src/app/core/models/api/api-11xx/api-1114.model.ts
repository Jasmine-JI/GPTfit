import { GroupLevel } from '../../../enums/professional/group-level.enum';
import { ResultCode } from '../../../enums/common/result-code.enum';

export interface Api1114Post {
  token: string;
  groupId: string;
  groupLevel: GroupLevel;
  userId: number;
}

export interface Api1114Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
