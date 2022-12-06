import { ProcessResult } from '../api-common/process-result.model';
import { Gender } from '../../../enums/personal';

export interface Api4106Post {
  token: string;
  groupId: string;
  type: number; // 1. 權限範圍內所有60階管理員 2. 權限範圍內所有60階一般成員
}

export interface Api4106Response {
  processResult: ProcessResult;
  info: Array<{
    baseInfo: {
      userId: number;
      userName: string;
      userIcon: string;
      gender: Gender;
      birthday: number;
    };
    groupBelonging: Array<{
      branchName: string;
      className: string;
    }>;
    classInfo?: {
      teachType: Array<number>;
      totalTeachCounts: number;
      totalTeachTime: number;
      maleAttendCounts: number;
      femaleAttendCounts: number;
      lastTeachDate: number;
    };
    oneMonthClassInfo?: {
      teachCounts: number;
      teachTotalTime: number;
      teachType: Array<number>;
    };
    attendInfo: {
      attendClassType: Array<number>;
      totalAttendCounts: number;
      totalAttendTime: number;
      lastAttendDate: number;
    };
    oneMonthAttendInfo: {
      attendClassCounts: number;
      attendClassTotalTime: number;
      attendClassType: Array<number>;
    };
    useDevice: Array<number>;
  }>;
}
