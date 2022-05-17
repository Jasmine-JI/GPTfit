/**
 * 群組階層
 */
export enum GroupLevel {
  brand = 30,
  branch = 40,
  class = 60,
  normal = 80
}

/**
 * 群組類別：品牌/企業
 */
export enum BrandType {
  brand = 1,
  enterprise
}

/**
 * 群組狀態
 */
export enum GroupStatus {
  open = 1,
  close,
  hide,
  disband,
  notFound,
  lock
}

/**
 * 群組加入狀態
 */
export enum GroupJoinStatus {
  applying = 1,
  allow,
  refuse,
  blacklist,
  outOfJoin
}