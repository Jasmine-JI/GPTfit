import { ProcessResult } from '../api-common/process-result.model';

export interface Api4104Post {
  token: string;
  groupId: string;
  groupLevel: number;
}

export interface BaseCounts {
  branchCounts?: number;
  classCounts?: number;
  totalTeachCounts: number;
  totalAttendCounts: number;
  adminCounts: number;
  memberCounts: number;
}

export interface MemberAnalysis {
  ageFieldName: Array<string>;
  maleFieldValue: Array<number>;
  femaleFieldValue: Array<number>;
}

export interface ClassTypeAnalysis {
  typeFieldName: Array<string>;
  teachCountsFieldValue: Array<number>;
  maleAttendCountsFieldValue: Array<number>;
  femaleAttendCountsFieldValue: Array<number>;
}

export interface ClassTimeAnalysis {
  typeFieldName: Array<string>;
  teachCountsFieldValue: Array<number>;
  attendCountsFieldValue: Array<number>;
}

export interface DeviceTypeAnalysis {
  deviceFieldName: Array<string>;
  useCountsFieldValue: Array<number>;
}

export interface ChildGroupAnalysis {
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
}

export interface Info {
  baseCounts: BaseCounts;
  memberAnalysis: MemberAnalysis;
  classTypeAnalysis: ClassTypeAnalysis;
  classTimeAnalysis: ClassTimeAnalysis;
  deviceTypeAnalysis: DeviceTypeAnalysis;
  childGroupAnalysis?: ChildGroupAnalysis;
}

export interface Api4104Response {
  processResult: ProcessResult;
  info: Info;
}
