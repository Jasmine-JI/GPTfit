import { GroupLevel } from '../../../enums/professional/group-level.enum';
import { ResultCode } from '../../../enums/common/result-code.enum';
import { GroupJoinStatus } from '../../../enums/professional/group-join-status.enum';
import { BrandType } from '../../../enums/professional/brand-type.enum';

export interface Api1110Post {
  token: string;
  groupLevel: GroupLevel;
  groupId: string;
  brandType: BrandType;
  joinUserId: number;
  joinStatus: GroupJoinStatus;
}

export interface Api1110Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
