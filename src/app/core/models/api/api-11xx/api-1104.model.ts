import { ResultCode } from '../../../enums/common/result-code.enum';
import { GroupJoinStatus } from '../../../enums/professional/group-join-status.enum';
import { BrandType } from '../../../enums/professional/brand-type.enum';

export interface Api1104Post {
  token: string;
  groupId: string;
  brandType: BrandType; // 1:品牌(未帶預設值), 2:企業
  actionType: 1 | 2; // 1:加入，2:退出
}

export interface Api1104Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    selfJoinStatus: GroupJoinStatus;
  };
}
