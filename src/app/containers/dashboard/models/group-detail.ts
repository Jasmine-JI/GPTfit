/**
 * api 1102 的info
 */
export interface GroupDetailInfo {
  brandType: number;
  classActivityType: Array<any>;
  coachType: string;
  groupDesc: string;
  groupIcon: string;
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
}
