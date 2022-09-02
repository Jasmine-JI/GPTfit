import { ResultCode } from '../../../enums/common/result-code.enum';
import { BrandType } from '../../../enums/professional/brand-type.enum';
import { GroupStatus } from '../../../enums/professional/group-status.enum';
import { GroupJoinStatus } from '../../../enums/professional/group-join-status.enum';
import { SportType } from '../../../enums/sports/sports-type.enum';
import { ShareOption } from './api-11xx-common.model';
import { SportTarget } from '../api-common/sport-target.model';

export interface Api1102Post {
  token: string;
  groupId: string;
  findRoot: 1 | 2; // 1:顯示父群組資訊，2:不顯父群組資訊(若未帶此參數，則視為2)
  avatarType: 1 | 2 | 3; // 1:Base64頭像 2.取得URL大頭像 3.取得URL中頭像(未帶此參數以Base64格式回應)
}

export interface Api1102Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    brandType: BrandType;
    groupId: string;
    groupName: string;
    groupIcon: string;
    groupDesc: string;
    groupStatus: GroupStatus;
    groupVideoUrl: string;
    selfJoinStatus: GroupJoinStatus;
    coachType: 2; // 目前已無分別，皆當作2（教練課）
    classActivityType: Array<SportType>;
    shareAvatarToMember: ShareOption;
    shareActivityToMember: ShareOption;
    shareReportToMember: ShareOption;
    groupRootInfo: Array<{
      systemGroupId?: string;
      systemName?: string;
      systemIcon?: string;
      locationGroupId?: string;
      locationName?: string;
      locationIcon?: string;
      brandGroupId?: string;
      brandName?: string;
      brandIcon?: string;
      branchGroupId?: string;
      branchName?: string;
      branchIcon?: string;
      classGroupId?: string;
      className?: string;
      classIcon?: string;
      generalGroupId?: string;
      generalName?: string;
      generalIcon?: string;
      target: SportTarget;
    }>;
    target: SportTarget;
  };
}
