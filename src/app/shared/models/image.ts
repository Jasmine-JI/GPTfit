/**
 * 圖床圖片所屬對象/類別
 */
export enum albumType {
  personalIcon = 1,
  personalScenery,
  personalSportFile,
  groupIcon = 11,
  groupScenery
}

/**
 * 圖床圖片所屬對象/類別
 */
export type AlbumType = 
  albumType.personalIcon | albumType.personalScenery | albumType.personalSportFile | albumType.groupIcon | albumType.groupScenery;
