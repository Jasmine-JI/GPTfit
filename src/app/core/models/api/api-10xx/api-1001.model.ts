import { ProcessResult } from '../api-common/process-result.model';
import { AccountType } from '../../../enums/personal/account-type.enum';

export interface Api1001Post {
  registerType: AccountType;
  name: string;
  email?: string;
  countryCode?: number;
  mobileNumber?: number;
  password: string;
  fromType: number;
  fromId: number;
}

export interface Api1001Response {
  processResult: ProcessResult;
  register: {
    type: AccountType;
    token: string;
  };
}
