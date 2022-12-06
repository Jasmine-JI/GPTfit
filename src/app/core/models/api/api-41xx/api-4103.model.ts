import { ProcessResult } from '../api-common/process-result.model';
import { CommerceStatus, BrandType, CommercePlan } from '../../../enums/professional';

export interface Api4103Post {
  token: string;
  filter: {
    commerceStatus: CommerceStatus;
    brandType: BrandType;
    plan: CommercePlan;
    expiredStatus: number;
    brandKeyword: string;
  };
  sort: {
    type: number;
    direction: number;
  };
  page: {
    index: number;
    counts: number;
  };
}

export interface Api4103Response {
  processResult: ProcessResult;
  totalCounts: number;
  info: Array<{
    baseInfo: {
      groupId: string;
      groupName: string;
      groupIcon: string;
      createDate: number;
      brandType: number;
      branchCounts: number;
      classCounts: number;
    };
    commerceInfo: {
      plan: number;
      status: number;
      planExpired: number;
      maxGroupMembers: number;
      currentGroupMembers: number;
    };
    device: {
      countsFieldName: Array<string>;
      countsFieldValue: Array<number>;
      modelTypeList: Array<string>;
    };
    classAnalysis: {
      teachCounts: Array<number>;
      attendsCounts: Array<number>;
      classFile: Array<number>;
    };
    oneMonthAnalysis: {
      teachCounts: Array<number>;
      attendsCounts: Array<number>;
      classFile: Array<number>;
      newMember: Array<number>;
      lossMember: Array<number>;
    };
  }>;
}
