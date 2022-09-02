import { ResultCode } from '../../../enums/common/result-code.enum';
import { CommercePlan } from '../../../enums/professional/commerce-plan.enum';
import { CommerceStatus } from '../../../enums/professional/commerce-status.enum';

export interface Api1115Post {
  token: string;
  groupId: string;
}

export interface Api1115Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    commercePlan: CommercePlan;
    commercePlanExpired: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
    commerceStatus: CommerceStatus;
    groupStatus: {
      maxBranches: number;
      maxClasses: number;
      maxGeneralGroups: number;
      currentBranches: number;
      currentClasses: number;
      currentGeneralGroups: number;
    };
    groupManagerStatus: {
      maxGroupManagers: number;
      currentBrandManagers: number;
      currentBranchManagers: number;
      currentFitnessCoaches: number;
      currentCoaches: number;
      currentGeneralGroupManagers: number;
    };
    groupMemberStatus: {
      maxGroupMembers: number;
      currentGroupMembers: number;
    };
  };
}
