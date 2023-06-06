/**
 * 從各個api 10xx response 將重複的物件抽出
 */

import { AccountType } from '../../../enums/personal/account-type.enum';
import { AccountStatus } from '../../../enums/personal/account-status.enum';
import { AccessRight } from '../../../enums/common/system-accessright.enum';
import { DataUnitType } from '../../../enums/common/data-unit-type.enum';
import { Gender } from '../../../enums/personal/gender.enum';
import { HrBase } from '../../../enums/sports/heart-rate-base.enum';
import { WeightTrainingLevel } from '../../../enums/sports/weight-training-level.enum';
import { SportTarget } from '../api-common/sport-target.model';
import { BenefitTimeStartZone } from '../../../enums/common';

/**
 * 使用者登入相關資訊
 */
export interface SignInInfo {
  counter: number;
  accountType: AccountType;
  accountStatus: AccountStatus;
  developerValue: AccessRight;
  token: string;
  tokenTimeStamp: number;
}

/**
 * 使用者個人相關資訊
 * (皆列為optional方便用於api 1011 post)
 */
export interface UserProfile {
  userId?: number;
  nickname?: string;
  themeImgUrl?: string;
  avatarUrl?: string;
  unit?: DataUnitType;
  email?: string;
  countryCode?: number;
  mobileNumber?: number;
  description?: string;
  lastBodyTimestamp?: number;
  bodyWeight?: number;
  bodyHeight?: number;
  fatRate?: number;
  muscleRate?: number;
  moistureRate?: number;
  proteinRate?: number;
  visceralFat?: number;
  skeletonRate?: number;
  basalMetabolic?: number;
  bodyAge?: number;
  birthday?: number;
  heartRateBase?: HrBase;
  heartRateMax?: number;
  heartRateResting?: number;
  strideLengthCentimeter?: number;
  gender?: Gender;
  handedness?: Handedness;
  wheelSize?: number;
  autoTargetStep?: AutoTargetStep;
  normalBedTime?: string;
  normalWakeTime?: string;
  cycleFtp?: number;
  weightTrainingStrengthLevel?: WeightTrainingLevel;
  weightTrainingConfigure?: string;
  target?: {
    fitTime?: number;
    calorie?: number;
    bodyWeight?: number;
    distance?: number;
    elevGain?: number;
    fatRate?: number;
    muscleRate?: number;
    sleep?: number;
    step?: number;
    visceralFat?: number;
  };
  workoutTarget?: SportTarget;
  editTimestamp?: number;
  nfcToken?: string;
  nfcEquipmentSN?: string;
  editNfcTokenTimestamp?: number;
  privacy?: {
    activityTracking?: Array<number>;
    activityTrackingReport?: Array<number>;
    lifeTrackingReport?: Array<number>;
  };
  customField?: {
    activityTimeHRZ: BenefitTimeStartZone;
  };
}

/**
 * 慣用手，0.左手 1.右手
 */
export type Handedness = 0 | 1;

/**
 * 自動步數目標，0:關閉 1:開啟
 */
export type AutoTargetStep = 0 | 1;
