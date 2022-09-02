import { ProcessResult } from '../api-common/process-result.model';
import { SignInInfo, UserProfile } from './api-10xx-common.model';

export interface Api1010Post {
  token?: string;
  targetUserId?: number | Array<number>;
}

export interface Api1010Response {
  processResult: ProcessResult;
  signIn: SignInInfo;
  userProfile: Array<UserProfile> | UserProfile;
}
