/**
 * 列表排序升降冪
 */
export enum SortDirection {
  desc = 1,
  asc,
}

/**
 * 條件類別
 */
export enum CondtionType {
  commerceStatus,
  brandType,
  planType,
  expiredStatus,
  keyword,
}

/**
 * 群組類別
 */
export enum BrandType {
  all,
  brand,
  enterprise,
}

/**
 * 方案到期狀態
 */
export enum ExpiredStatus {
  all,
  notExpire,
  expired,
}

/**
 * 群組分析列表排序類別
 */
export enum GroupListSortType {
  creationTime = 1,
  expiredTime,
  totalMembers,
  memberLimitation,
}
