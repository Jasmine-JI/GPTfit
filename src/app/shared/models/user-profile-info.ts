/**
 * 合併api v2 1010 和 api 1113
 */
export interface UserProfileInfo {
  systemAccessRight?: Array<number>;
  autoTargetStep?: number;
  avatarUrl: string;
  basalMetabolic?: number;
  birthday?: string;
  bodyAge?: number;
  bodyHeight?: number;
  bodyWeight?: number;
  description: number | string;
  email?: string;
  countryCode?: number;
  mobileNumber?: number;
  fatRate?: number;
  gender?: Sex;
  groupAccessRightList?: Array<any>;
  handedness?: number | string;
  heartRateBase?: HrBase;
  heartRateMax?: number;
  heartRateResting?: number;
  lastBodyTimestamp?: number | string;
  moistureRate?: number;
  muscleRate?: number;
  nickname: string;
  normalBedTime?: string;
  normalWakeTime?: string;
  privacy?: {
    activityTracking: Array<number | string>
    activityTrackingReport: Array<number | string>
    lifeTrackingReport: Array<number | string>
  };
  proteinRate?: number;
  skeletonRate?: number;
  strideLengthCentimeter?: number;
  target?: {
    bodyWeight: number;
    calorie: number;
    distance: number;
    elevGain: number;
    fatRate: number;
    fitTime: number;
    muscleRate: number;
    sleep: number;
    step: number;
    visceralFat: number;
  };
  unit?: number;
  userId: number;
  visceralFat?: number;
  weightTrainingStrengthLevel?: number;
  wheelSize?: number;
  themeImgUrl?: string;
  accountType?: AccountTypeEnum;
  accountStatus?: AccountStatusEnum;
}

/**
 * 性別
 */
export enum Sex {
  male,
  female,
  unlimit
}

export enum HrBase {
  max,
  reserve
}

/**
 * 帳號類別
 */
export enum AccountTypeEnum {
  email = 1,
  phone
}


/**
 * 帳號狀態
 */
 export enum AccountStatusEnum {
  unenabled = 1,
  enabled
}
