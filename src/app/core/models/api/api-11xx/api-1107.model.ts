import { GroupLevel } from '../../../enums/professional/group-level.enum';
import { ResultCode } from '../../../enums/common/result-code.enum';
import { GroupStatus } from '../../../enums/professional/group-status.enum';

export interface Api1107Post {
  token: string;
  groupLevel: GroupLevel;
  groupId: string;
  changeStatus: GroupStatus;
}

export interface Api1107Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    groupStatus: GroupStatus;
  };
}
