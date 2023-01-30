import { ProcessResult } from '../api-common/process-result.model';
import { SystemAnalysisType } from '../../../enums/api';

export interface Api4101Post {
  token: string;
  type: SystemAnalysisType; // 1.群組 2.會員 3.裝置
}

export interface Api4101Response {
  processResult: ProcessResult;
  info: {
    baseCounts: {
      totalBrand?: number;
      inOperationBrand?: number;
      totalBranch?: number;
      totalClass?: number;
      totalGroupMember?: number;
      totalClassFile?: number;
      totalMember?: number;
      totalActiveMember?: number;
      totalSportsFile?: number;
      totalLifeTrackingFile?: number;
      totalEnableDevice?: number;
      totalRegisterDevice?: number;
    };
    planAnalysis?: {
      fieldName: Array<string>;
      brandFieldValue: Array<number>;
      enterpriseFieldValue: Array<number>;
    };
    overviewAnalysis?: {
      fieldName: Array<string>;
      brandFieldValue: Array<number>;
      enterpriseFieldValue: Array<number>;
    };
    classTypeAnalysis?: {
      typeFieldName: Array<string>;
      teachCountFieldValue: Array<number>;
      fileCountFieldValue: Array<number>;
    };
    activeAnalysis?: {
      male: number;
      female: number;
    };
    sportsTypeAnalysis?: {
      typeFieldName: Array<string>;
      maleFieldValue: Array<number>;
      femaleFieldValue: Array<number>;
    };
    ageAnalysis?: {
      ageFieldName: Array<string>;
      maleFieldValue: Array<number>;
      femaleFieldValue: Array<number>;
    };
    deviceTypeAnalysis?: {
      deviceFieldName: Array<string>;
      enableFieldValue: Array<number>;
      registerFieldValue: Array<number>;
    };
  };
}
