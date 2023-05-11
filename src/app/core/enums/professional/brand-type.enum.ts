/**
 * 群組類別：品牌/企業
 */
export enum BrandType {
  searchAll, // 因別的api把0當全部
  brand = 1,
  enterprise,
  school,
  all, // 不分類別，用在搜尋
}
