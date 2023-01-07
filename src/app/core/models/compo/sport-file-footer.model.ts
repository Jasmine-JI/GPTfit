export interface BaseInfo {
  name?: string;
  imgUrl?: string;
  description?: string;
}

export interface DeviceInfo extends BaseInfo {
  equipmentSN?: string;
  modelID: string;
  modelTypeID: string;
}

export interface ClassInfo extends BaseInfo {
  brandName: string;
  branchName: string;
}

export interface FileInfo {
  versionName?: string;
  equipmentFwCode?: string;
  editDate?: string;
  syncDate?: string;
  createFrom?: string;
}

export interface FileFooterInfo {
  deviceInfo?: Array<DeviceInfo>;
  classInfo?: Array<ClassInfo>;
  coachInfo?: Array<BaseInfo>;
  fileInfo?: Array<FileInfo>;
  tag?: Array<string>;
}
