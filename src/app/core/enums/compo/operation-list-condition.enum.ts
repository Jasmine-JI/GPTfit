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
  gender,
  childName,
  teachType,
  age,
}

/**
 * 群組類別
 */
export enum BrandType {
  all,
  brand,
  enterprise,
  school,
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

/**
 * 教練/學員分析列表排序類別
 */
export enum MemberListSortType {
  name = 1,
  gender,
  age,
  totalTeachCounts,
  totalStudentsCounts,
  lastTeachTime,
  totalAttendCounts,
  totalAttendHour,
  lastAttendTime,
}

/**
 * 成員身份類別
 */
export enum MemberType {
  admin = 1,
  normal,
}
