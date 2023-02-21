import { ProcessResult } from '../api-common/process-result.model';
import { AnalysisUpdateStatus } from '../../../enums/api';

export interface Api4108Post {
  token: string;
  groupId: string;
}

export interface Api4108Response {
  processResult: ProcessResult;
  update: {
    status: AnalysisUpdateStatus;
    timestamp: number;
  };
}
