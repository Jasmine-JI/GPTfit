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
  privacy?: {
    activityTracking: Array<number | string>;
    activityTrackingReport: Array<number | string>;
    lifeTrackingReport: Array<number | string>;
  }
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

/**
 * 群組階層
 */
export enum GroupLevel {
  brand = 30,
  branch = 40,
  class = 60,
  normal = 80
}

/**
 * 群組類別：品牌/企業
 */
export enum BrandType {
  brand = 1,
  enterprise
}

/**
 * 群組狀態
 */
export enum GroupStatus {
  open = 1,
  close,
  hide,
  disband,
  notFound,
  lock
}

/**
 * 團體或個人分析
 */
export type SettingObj = 'group' | 'person';
