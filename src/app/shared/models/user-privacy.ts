/**
 * 隱私權開放對象
 */
export enum PrivacyObj {
  self = 1,
  myFriend,
  myGroup,
  onlyGroupAdmin,
  anyone = 99,
}

/**
 * 隱私權設定對象
 */
export enum PrivacyEditObj {
  file = 1,
  sportsReport,
  lifeTracking,
}

export const allPrivacyItem = [
  PrivacyObj.self,
  // PrivacyObj.myFriend
  PrivacyObj.myGroup,
  PrivacyObj.onlyGroupAdmin,
  PrivacyObj.anyone,
];
