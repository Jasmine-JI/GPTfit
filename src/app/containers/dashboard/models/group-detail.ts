/**
 * api 1102 的info
 */
export interface GroupDetailInfo {
  brandType: number;
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
  expired?: boolean;
  commerceStatus?: number;
  shareActivityToMember: object;
  shareAvatarToMember: object;
  shareReportToMember: object;
  groupLevel?: number;
}

/**
 * 群組各階層資訊
 */
export interface GroupArchitecture {
  groupId: string;
  brands: any;
  branches: any;
  coaches: any;
}

/**
 * 使用者在該群組的簡易資訊
 */
export interface UserSimpleInfo {
  nickname: string;
  userId: number;
  token: string;
  accessRight: Array<number>;
  joinStatus: number;
  isGroupAdmin: boolean;
}

/**
 * api 1103回應的groupMemberInfo內容
 */
export interface MemberInfo {
  accessRight: number | string;
  groupId: string;
  joinStatus: number;
  memberIcon: string;
  memberId: number;
  memberName: string;
  coachName?: string;
  branchName?: string;
}

/**
 * 群組各種編輯模式狀態
 */
export type EditMode = 'edit' | 'create' | 'complete' | 'close';
