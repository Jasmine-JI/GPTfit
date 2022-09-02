import { GroupLevel } from '../../../enums/professional/group-level.enum';
import { ResultCode } from '../../../enums/common/result-code.enum';
import { SportType } from '../../../enums/sports/sports-type.enum';
import { SportTarget } from '../api-common/sport-target.model';

/**
 * 界面未開放的選項不列入model中
 */
export interface Api1105Post {
  token: string;
  groupLevel: GroupLevel;
  groupId: string;
  groupName: string;
  groupDesc: string;
  groupVideoUrl: string;
  classActivityType?: Array<SportType>;
  target?: SportTarget;
}

export interface Api1105Response {
  resultCode: ResultCode;
  resultMessage: string;
  msgCode: number;
  apiCode: number;
  info: {
    rtnMsg: string;
  };
}
