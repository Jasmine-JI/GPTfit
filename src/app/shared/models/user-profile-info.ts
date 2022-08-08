import { AccessRight } from '../enum/accessright';
import { PersonalTarget } from './sport-target';
import { AccountStatusEnum, AccountTypeEnum } from '../enum/account';
import { Sex, HrBase } from '../enum/personal';

/**
 * 合併api v2 1010
 */
export interface UserProfileInfo {
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
    activityTracking: Array<number | string>;
    activityTrackingReport: Array<number | string>;
    lifeTrackingReport: Array<number | string>;
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
  workoutTarget?: PersonalTarget;
}

/**
 * api 1003 或 api 1010內的 signIn物件
 */
export interface SignInfo {
  counter: number;
  accountType: AccountTypeEnum;
  accountStatus: AccountStatusEnum;
  developerValue: AccessRight;
  token: string;
  tokenTimeStamp: number;
}
