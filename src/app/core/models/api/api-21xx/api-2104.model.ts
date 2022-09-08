import { ResultCode } from '../../../enums/common/result-code.enum';
import { DateUnit } from '../../../enums/common/date-unit.enum';
import { SportType } from '../../../enums/sports/sports-type.enum';
import { MuscleCode } from '../../../enums/sports/muscle-code.enum';

export interface Api2104Post {
  token: string;
  type: DateUnit; // api 僅開放到月，這邊季跟年先預留
  targetUserId: Array<number>;
  filterStartTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
  filterEndTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
}

export type Api2104Response = Array<SportsReport>;

export interface SportsReport {
  resultCode: ResultCode;
  resultMessage: string;
  apiCode: number;
  msgCode: number;
  alaFormatVersionName: string;
  userId: number;
  reportInfo: {
    type: number;
    startTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
    endTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
    totalPoint: number;
  };
  reportActivityDays?: Array<SportsReportData>;
  reportActivityWeeks?: Array<SportsReportData>;
  reportActivityMonths?: Array<SportsReportData>;
}

export interface SportsReportData {
  activities: [
    {
      type: SportType;
      totalActivities: number;
      totalSecond: number;
      totalDistanceMeters: number;
      elevGain: number;
      elevLoss: number;
      calories: number;
      avgHeartRateBpm: number;
      avgMaxHeartRateBpm: number;
      avgSpeed: number;
      avgMaxSpeed: number;
      runAvgCadence: number;
      avgRunMaxCadence: number;
      totalFeedbackEnergy: number;
      totalHrZone0Second: number;
      totalHrZone1Second: number;
      totalHrZone2Second: number;
      totalHrZone3Second: number;
      totalHrZone4Second: number;
      totalHrZone5Second: number;
      personalizedActivityIntelligence: number;
      totalActivitySecond: number;
      cycleAvgCadence: number;
      avgCycleMaxCadence: number;
      cycleAvgWatt: number;
      avgCycleMaxWatt: number;
      totalFtpZone0Second: number;
      totalFtpZone1Second: number;
      totalFtpZone2Second: number;
      totalFtpZone3Second: number;
      totalFtpZone4Second: number;
      totalFtpZone5Second: number;
      totalFtpZone6Second: number;
      avgEstimateFtp: number;
      totalWeightKg: number;
      totalReps: number;
      weightTrainingInfo: Array<{
        muscle: MuscleCode;
        max1RmWeightKg: number;
        totalWeightKg: number;
        totalSets: number;
        totalReps: number;
      }>;
      swimAvgCadence: number;
      avgSwimMaxCadence: number;
      avgSwolf: number;
      bestSwolf: number;
      rowingAvgCadence: number;
      avgRowingMaxCadence: number;
      rowingAvgWatt: number;
      rowingMaxWatt: number;
      totalPlusGforceX: number;
      totalPlusGforceY: number;
      totalPlusGforceZ: number;
      totalMinusGforceX: number;
      totalMinusGforceY: number;
      totalMinusGforceZ: number;
      maxGforceX: number;
      maxGforceY: number;
      maxGforceZ: number;
      miniGforceX: number;
      miniGforceY: number;
      miniGforceZ: number;
      totalSwingCount: number;
      totalForehandSwingCount: number;
      totalBackhandSwingCount: number;
      avgSwingSpeed: number;
      maxSwingSpeed: number;
    }
  ];
  startTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
  endTime: string; // YYYY-MM-DDTHH:mm:ss.SSSZ
}
