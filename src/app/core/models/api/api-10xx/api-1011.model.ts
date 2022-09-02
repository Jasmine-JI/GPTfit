import { ProcessResult } from '../api-common/process-result.model';
import { UserProfile } from './api-10xx-common.model';

export interface Api1011Post {
  token: string;
  userProfile: UserProfile;
}

export interface Api1011Response {
  processResult: ProcessResult;
}
