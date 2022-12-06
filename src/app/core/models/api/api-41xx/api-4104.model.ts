import { ProcessResult } from '../api-common/process-result.model';

export interface Api4104Post {
  token: string;
  groupId: string;
}

export interface Api4104Response {
  processResult: ProcessResult;
  info: {
    baseCounts: {
      branchCounts?: number;
      classCounts?: number;
      totalTeachCounts: number;
      totalAttendCounts: number;
      adminCounts: number;
      memberCounts: number;
    };
    memberAnalysis: {
      ageFieldName: Array<string>;
      maleFieldValue: Array<number>;
      femaleFieldValue: Array<number>;
    };
    classTypeAnalysis: {
      typeFieldName: Array<string>;
      teachCountsFieldValue: Array<number>;
      maleAttendCountsFieldValue: Array<number>;
      femaleAttendCountsFieldValue: Array<number>;
    };
    classTimeAnalysis: {
      typeFieldName: Array<string>;
      teachCountsFieldValue: Array<number>;
      attendCountsFieldValue: Array<number>;
    };
    deviceTypeAnalysis: {
      deviceFieldName: Array<string>;
      useCountsFieldValue: Array<number>;
    };
    childGroupAnalysis?: {
      groupIdFieldName: Array<string>;
      groupNameFieldValue: Array<string>;
      maleCoachCountsFieldValue: Array<number>;
      femaleCoachCountsFieldValue: Array<number>;
      maleMemberCountsFieldValue: Array<number>;
      femaleMemberCountsFieldValue: Array<number>;
      teachTimeFieldValue: Array<number>;
      teachCountsFieldValue: Array<number>;
      teachTypeFieldValue: Array<Array<number>>;
      maleAttendCountsFieldValue: Array<number>;
      femaleAttendCountsFieldValue: Array<number>;
      lastTeachDateFieldValue: Array<number>;
      wearableCountsFieldValue: Array<number>;
      sensorCountsFieldValue: Array<number>;
      treadmillCountsFieldValue: Array<number>;
      spinBikeCountsFieldValue: Array<number>;
      rowMachineCountsFieldValue: Array<number>;
    };
  };
}
