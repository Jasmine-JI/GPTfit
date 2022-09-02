import { AccessRight } from '../../../enums/common/system-accessright.enum';

export interface ShareOption {
  switch: 1 | 2 | 3 | 4; // 1:全開，2:全關，3:僅開指定權限值(enableAccessRight)，4.僅關閉指定權限值(disableAccessRight)
  enableAccessRight: Array<AccessRight>;
  disableAccessRight: Array<AccessRight>;
}
