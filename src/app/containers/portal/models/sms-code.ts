export interface SMSCode {
  resultCode: number;
  smsVerifyCode: string;
  info: {
    rtnMsg: string
  };
}
