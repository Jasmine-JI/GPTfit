import { ProcessResult } from '../api-common/process-result.model';
import { AnalysisUpdateType } from '../../../enums/api';

export interface Api4107Post {
  token: string;
  groupId: string;
  type: AnalysisUpdateType;
}

export interface Api4107Response {
  processResult: ProcessResult;
}
