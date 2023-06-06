import { ProcessResult } from '../api-common/process-result.model';
import { TimeRange } from './index';

export interface Api4105Post {
  token: string;
  groupId: string;
  groupLevel: number;
  startDate: number;
  endDate: number;
  dateUnit: number;
}

export interface Api4105Response {
  processResult: ProcessResult;
  trend: {
    timeRange: TimeRange;
    groupCountsAnalysis: {
      fieldName: Array<string>;
      fieldValue: Array<Array<number>>;
    };
    childGroupAnalysisList: {
      innerFieldName: Array<string>;
      childGroupList: Array<{
        groupId: string;
        groupName: string;
        fieldValue: Array<Array<number>>;
      }>;
    };
    deviceUsedCounts: {
      fieldName: Array<string>;
      useCountsFieldValue: Array<Array<number>>;
    };
  };
}
