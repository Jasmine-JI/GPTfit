import { ResultCode } from '../../../enums/common/result-code.enum';
import { CommercePlan } from '../../../enums/professional/commerce-plan.enum';
import { CommerceStatus } from '../../../enums/professional/commerce-status.enum';

export interface Api1116Post {
  token: string;
  groupId: string;
  commercePlan: CommercePlan;
  commercePlanExpired: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
  commerceStatus: CommerceStatus;
  groupSetting: {
    maxBranches: number;
    maxClasses: number;
    maxGeneralGroups: number;
  };
  groupManagerSetting: {
    maxGroupManagers: number;
  };
  groupMemberSetting: {
    maxGroupMembers: number;
  };
}

export interface Api1116Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
