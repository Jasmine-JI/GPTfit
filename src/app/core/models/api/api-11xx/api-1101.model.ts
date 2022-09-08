import { BrandType } from '../../../enums/professional/brand-type.enum';
import { GroupLevel } from '../../../enums/professional/group-level.enum';
import { GroupJoinStatus } from '../../../enums/professional/group-join-status.enum';
import { CommerceStatus } from '../../../enums/professional/commerce-status.enum';
import { AccessRight } from '../../../enums/common/system-accessright.enum';
import { SportType } from '../../../enums/sports/sports-type.enum';
import { ResultCode } from '../../../enums/common/result-code.enum';

export interface Api1101Post {
  token: string;
  brandType: BrandType;
  category: 1 | 2 | 3; // 1:全部群組列表，2:我的群組列表，3:搜尋列表
  groupLevel: GroupLevel;
  searchWords: string;
  sortType: 1 | 2; // 1.groupId(預設) 2.commercePlanExpiredTime
  sortDirection: 1 | 2; // 1.降冪(預設) 2.升冪
  page: number;
  pageCounts: number;
}

export interface Api1101Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    totalCounts: number;
    groupList: Array<{
      brandType: BrandType;
      groupId: string;
      groupName: string;
      groupDesc;
      groupStatus;
      groupProperty?: AccessRight;
      joinStatus: GroupJoinStatus;
      commercePlanExpiredTime: number;
      commerceStaus: CommerceStatus;
      classActivityType: Array<SportType>;
    }>;
  };
}
