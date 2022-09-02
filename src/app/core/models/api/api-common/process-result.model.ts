import { ResultCode } from '../../../enums/common';

export interface ProcessResult {
  resultCode: ResultCode;
  resultMessage: string;
  apiCode: number;
  apiReturnCode: number;
  apiReturnMessage: string;
  imgLockCode?: string;
}
