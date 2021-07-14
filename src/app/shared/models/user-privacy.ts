
/**
 * 隱私權開放對象
 */
export enum privacyObj {
  self = 1,
  myFriend,
  myGroup,
  onlyGroupAdmin,
  anyone = 99
}

/**
 * 隱私權代碼 1.僅自己 2.我的朋友 3.我的群組 4.我的群組 99.任何人
 */
export type PrivacyCode = 1 | 2 | 3 | 4 | 99;