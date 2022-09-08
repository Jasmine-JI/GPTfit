import { ResultCode } from '../../../enums/common/result-code.enum';
import { DateUnit } from '../../../enums/common/date-unit.enum';
import { Gender } from '../../../enums/personal/gender.enum';

export interface Api2107Post {
  token: string;
  type: DateUnit; // api 僅開放到月，這邊季跟年先預留
  targetUserId: Array<number>;
  filterStartTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
  filterEndTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
}

export type Api2107Response = Array<LifeTrackingReport>;

export interface LifeTrackingReport {
  alaFormatVersionName: string;
  apiCode: number;
  userId: number;
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  reportInfo: {
    type: number;
    startTime: string;
    endTime: string;
    totalPoint: number;
  };
  reportLifeTrackingDays: Array<LifeTrackingReportData>;
  reportLifeTrackingWeeks: Array<LifeTrackingReportData>;
  reportLifeTrackingMonths: Array<LifeTrackingReportData>;
}

export interface LifeTrackingReportData {
  gender: Gender;
  birthYear: string; // YYYY
  startTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
  endTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
  restHeartRate: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  totalFitSecond: number | null;
  totalStep: number | null;
  targetStep: number | null;
  totalDistanceMeters: number | null;
  totalCalories: number | null;
  lifeCalories: number | null;
  activityCalories: number | null;
  elevGain: number | null;
  totalSleepSecond: number | null;
  avgStress: number | null;
  bodyHeight: number;
  bodyWeight: number;
  muscleRate: number | null;
  fatRate: number | null;
  moistureRate: number | null;
  proteinRate: number | null;
  visceralFat: number | null;
  skeletonRate: number | null;
  basalMetabolicRate: number | null;
  bodyAge: number | null;
  walkElevGain: number | null;
  walkElevLoss: number | null;
  totalDeepSecond: number | null;
  totalLightSecond: number | null;
  totalStandUpSecond: number | null;
  avgOxygenSaturation: number | null;
  maxOxygenSaturation: number | null;
  minOxygenSaturation: number | null;
  avgHeartRateVariability: number | null;
  maxHeartRateVariability: number | null;
  minHeartRateVariability: number | null;
}
