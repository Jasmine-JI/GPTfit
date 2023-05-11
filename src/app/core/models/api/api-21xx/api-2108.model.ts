export interface Api2108Post {
  token: string;
  fileId: number;

  //以下編輯參數均以「選填」方式
  fileInfo: {
    createFrom?: string;
    countryRegion?: string;
    language?: string;
    complexId?: number;
    syncDate?: string;
    dispName?: string;
    author?: string;
    editDate?: string;
    equipmentSN?: string;
    equipmentFwName?: string;
    equipmentFwCode?: string;
    equipmentHwName?: string;
    equipmentHwCode?: string;
    exampleFormat?: string;
    company?: string;
    versionName?: string;
    versionCode?: string;
    location?: string;
    photo?: string;
    video?: string;
    tag?: string;
    tagman?: string;
    note?: string;
    privacy?: Array<number>;
    teacher?: string;
    class?: string;
    drand?: string;
    matchedPlanId?: number;
  };
}

export interface Api2108Response {
  alaFormatVersionName: string;
  resultCode: number;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
