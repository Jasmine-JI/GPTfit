export interface SignupResponse {
  resultCode: number;
  info: {
    rtnMsg: string
  };
}

export enum ResetPasswordFlow {
  request = 1,
  verify,
  reset
}

export enum UnlockFlow {
  requestUnlockImage = 1,
  sendUnlockCode
}

export enum QrSignInFlow {
  submitGuid = 1,
  longPolling,
  allowLogin
}