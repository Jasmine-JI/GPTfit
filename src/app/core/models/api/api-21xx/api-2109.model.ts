export interface Api2109Post {
  token: string;
  fileId: Array<number>;
}

export interface Api2109Response {
  alaFormatVersionName: string;
  resultCode: number;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
