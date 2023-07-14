import { ResultCode } from '../../../enums/common/result-code.enum';
import { QueryType } from '../../../enums/api';
import { AlaApp } from '../../../enums/common';

export interface Api7015Post {
  token: string;
  queryType: QueryType;
  queryArray: Array<AlaApp>;
}

export interface Api7015Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    productInfo: Array<ProductInfo>;
  };
}

export interface ProductInfo {
  bluetoothServiceUuid: string;
  customerID: string;
  equipmentSN: string;
  mainApp: Array<AppInfo>;
  secondaryApp: Array<AppInfo>;
  'manual_en-US': string;
  'manual_zh-CN': string;
  'manual_zh-TW': string;
  modelID: string;
  modelImg: string;
  modelName: string;
  modelTypeID: string;
  modelTypeName: string;
  'relatedLinks_en-US': Array<ProductionLink>;
  'relatedLinks_zh-CN': Array<ProductionLink>;
  'relatedLinks_zh-TW': Array<ProductionLink>;
}

export interface AppInfo {
  appAndroidUrl: string;
  appApkUrl: string;
  appIconUrl: string;
  appId: string;
  appIosUrl: string;
  'appManual_en-US': string;
  'appManual_zh-CN': string;
  'appManual_zh-TW': string;
  appName: string;
}

export interface ProductionLink {
  dispName: string;
  link: string;
}
