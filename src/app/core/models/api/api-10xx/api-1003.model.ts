import { ProcessResult } from '../api-common/process-result.model';
import { SignInType } from '../../../enums/personal/sign-in-type.enum';
import { ThirdParty } from '../../../enums/personal/third-party.enum';
import { SignInInfo, UserProfile } from './api-10xx-common.model';

export interface Api1003Post {
  signInType: SignInType;
  email?: string;
  countryCode?: number;
  mobileNumber?: number;
  password?: string;
  token?: string;
  nfcEquipmentSN?: string; // nfc登入用
  bleMacAddress?: string; // nfc登入用
  deviceAccess?: string; // nfc登入用
  verifyCode?: string; // nfc登入用
}

export interface Api1003Response {
  processResult: ProcessResult;
  signIn: SignInInfo;
  userProfile: UserProfile;
  thirdPartyAgency: Array<{
    interface: ThirdParty;
    status: boolean;
  }>;
  valuableService: Array<{
    serviceType: number;
    status: boolean;
    endTimeStamp: number;
  }>;
}
