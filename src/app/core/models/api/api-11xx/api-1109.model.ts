import { ResultCode } from '../../../enums/common/result-code.enum';
import { GroupStatus } from '../../../enums/professional/group-status.enum';
import { BrandType } from '../../../enums/professional/brand-type.enum';
import { SportType } from '../../../enums/sports/sports-type.enum';
import { CommercePlan } from '../../../enums/professional/commerce-plan.enum';
import { SportTarget } from '../api-common/sport-target.model';
import { ShareOption } from './api-11xx-common.model';

/**
 * icon相關已改使用圖床api，故不列入
 */
export interface Api1109Post {
  token: string;
  brandType: BrandType;
  groupId: string;
  groupStatus: GroupStatus;
  groupManager: Array<number>;
  levelName: string;
  levelDesc: string;
  levelType: 1 | 2 | 3 | 4 | 5 | 6; // 1:建立系統，2:建立地區，3:建立品牌，4:建立分店，5:新增教練(課)，6建立群組
  coachType: 2 | null; // 目前已無分別，故建立教練課時皆帶2（教練課）
  classActivityType?: Array<SportType>;
  tag?: Array<string>;
  address?: string;
  startTime?: number;
  endTime?: number;
  commercePlan?: CommercePlan;
  commercePlanExpired: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
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
  shareAvatarToMember: ShareOption;
  shareActivityToMember: ShareOption;
  shareReportToMember: ShareOption;
  target: SportTarget;
}

export interface Api1109Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    newGroupId: string;
  };
}
