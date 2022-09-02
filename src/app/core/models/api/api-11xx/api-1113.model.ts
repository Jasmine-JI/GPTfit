import { ResultCode } from '../../../enums/common/result-code.enum';
import { AccessRight } from '../../../enums/common/system-accessright.enum';
import { GroupJoinStatus } from '../../../enums/professional/group-join-status.enum';

export interface Api1113Post {
  token: string;
}

export interface Api1113Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    groupAcessRight: Array<{
      groupId: string;
      accessRight: AccessRight;
      joinStatus: GroupJoinStatus;
    }>;
  };
}
