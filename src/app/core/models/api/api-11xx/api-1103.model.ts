import { GroupLevel } from '../../../enums/professional/group-level.enum';
import { ResultCode } from '../../../enums/common/result-code.enum';
import { GroupStatus } from '../../../enums/professional/group-status.enum';
import { AccessRight } from '../../../enums/common/system-accessright.enum';
import { Gender } from '../../../enums/personal/gender.enum';
import { GroupJoinStatus } from '../../../enums/professional/group-join-status.enum';

export interface Api1103Post {
  token: string;
  groupId: string;
  groupLevel: GroupLevel;
  infoType: 1 | 2 | 3 | 4 | 5; // 1:子群組資訊，2:管理員資訊，3:一般成員資訊，4:待加入成員資訊, 5.權限範圍內所有正式成員資訊
  avatarType: 1 | 2 | 3; // 1:Base64頭像 2.取得URL大頭像 3.取得URL中頭像(未帶此參數以URL大頭像格式回應)
}

export interface Api1103Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
    totalCounts: number;
    subGroupInfo: {
      brands?: Array<GroupInfo>;
      branches?: Array<GroupInfo>;
      coches?: Array<GroupInfo>;
    };
    groupMemberInfo: Array<{
      groupId: string;
      memberId: number;
      memberName: string;
      accessRight: AccessRight;
      memberIcon: string;
      gender: Gender;
      birthday: string; // YYYYMMDD
      joinStatus: GroupJoinStatus;
    }>;
  };
}

interface GroupInfo {
  groupId: string;
  groupName: string;
  groupStatus: GroupStatus;
  groupIcon: string;
  accessRight: AccessRight;
}
