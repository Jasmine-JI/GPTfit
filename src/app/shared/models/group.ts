import { AccessRight } from '../enum/accessright';
import { GroupJoinStatus } from '../enum/professional';
import { SportTarget } from '../../core/models/api/api-common/sport-target.model';
import { Sex } from '../enum/personal';
import { BrandType } from '../enum/professional';
import { BenefitTimeStartZone } from '../../core/enums/common';

/**
 * api 1103 response 的 info.groupAccessRight[] 的內容
 */
export interface GroupAccessrightInfo {
  groupId: string;
  accessRight: AccessRight;
  joinStatus: GroupJoinStatus;
}

/**
 * api 1103 response 的 info.groupMemberInfo[] 的內容
 */
export interface GroupMemberInfo {
  accessRight: AccessRight;
  birthday: string;
  gender: Sex;
  groupId: string;
  joinStatus: GroupJoinStatus;
  memberIcon: string;
  memberId: number;
  memberName: string;
}

/**
 * api 1102 response 的 info 內容
 */
export interface GroupDetail {
  brandType: BrandType;
  classActivityType: Array<any>;
  coachType: string;
  groupDesc: string;
  groupIcon: string;
  groupThemeImgUrl: string;
  groupId: string;
  groupName: string;
  groupRootInfo: Array<any>;
  groupStatus: number;
  groupVideoUrl: string;
  rtnMsg: string;
  selfJoinStatus: number;
  shareActivityToMember: object;
  shareAvatarToMember: object;
  shareReportToMember: object;
  target?: SportTarget;
  customField?: {
    activityTimeHRZ: BenefitTimeStartZone;
  };
}
