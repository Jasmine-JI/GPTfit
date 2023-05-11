import { PrivacyObj } from '../../enums/api';

/**
 * 目前開放設定的所有隱私權對象
 */
export const allPrivacyItem = [
  PrivacyObj.self,
  // PrivacyObj.myFriend
  PrivacyObj.myGroup,
  PrivacyObj.onlyGroupAdmin,
  PrivacyObj.anyone,
];
