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
  accountType?: AccountType;
}

/**
 * 性別
 */
export enum sex {
  male,
  female
}

export type Sex = sex.male | sex.female;

export enum hrBase {
  max,
  reserve
}

export type HrBase = hrBase.max | hrBase.reserve;

/**
 * 帳號類別
 */
export enum accountTypeEnum {
  email = 1,
  phone
}

export type AccountType = accountTypeEnum.email | accountTypeEnum.phone;
